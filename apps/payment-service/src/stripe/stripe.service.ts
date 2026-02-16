import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";

import mongoose, { Model, Types } from "mongoose";
import Stripe from "stripe";
import * as generateUniqueId from "ultra-unique-id";

import { Admin, AdminDocument } from "src/admin/schema/admin.schema";
import { AssetRepository } from "src/assets/repositories/asset.repository";
import { TokenRepository } from "src/assets/repositories/token.repository";
import { AssetListing } from "src/assets/schemas/asset-listing.schema";
import { Rewards } from "src/assets/schemas/rewards.schema";
import { TokenTransaction } from "src/assets/schemas/token-transaction.schema";
import { Token } from "src/assets/schemas/token.schema";
import {
  Notification,
  NotificationDocument,
} from "src/notification/schema/notification.schema";
import { PaymentRepository } from "src/payments/repositories/payment.repository";
import { Payment } from "src/payments/schemas/payment.schema";
import { SendGridServices } from "src/shared/services/send-grid/send-grid.service";
import { AssetStatus } from "src/shared-kernel/utils/constants/asset-context";
import { EMAIL_CONSTANT } from "src/shared-kernel/utils/constants/email.messages";
import { ERROR_MESSAGES } from "src/shared-kernel/utils/constants/exceptions/error-message";
import { NOTIFICATION_TEMPLATES } from "src/shared-kernel/utils/constants/notification-template";
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "src/shared-kernel/utils/constants/transactions";
import {
  STRIP_WEBHOOK_EVENTS,
  STRIPE_URLS,
} from "src/stripe/constants/stripe-url";
import { DetailsToUpdate } from "src/stripe/interface/update-details.interface";
import {
  AccountStatusResponse,
  CreateStripeAccount,
} from "src/users/interface/create-stripe-account.interface";
import { UserRepository } from "src/users/repositories/user.repository";

import { COMMISSION_PERCENTAGE, MAX_AMOUNT } from "./constants/max-amount";
import {
  CreatePaymentDetails,
  WebhookHandlerInterface,
} from "./interface/create-payment";

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  constructor(
    @InjectModel(TokenTransaction.name)
    private readonly tokenTransactionModel: Model<TokenTransaction>,
    @InjectModel(AssetListing.name)
    private readonly assetListingModel: Model<AssetListing>,
    @InjectModel(Rewards.name)
    private readonly rewardsModel: Model<Rewards>,
    @InjectModel(Notification.name)
    private readonly NotificationModel: Model<NotificationDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
    private readonly configService: ConfigService,
    private readonly paymentRepository: PaymentRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly assetRepository: AssetRepository,
    private readonly userRepository: UserRepository,
    private readonly sendGridService: SendGridServices,
  ) {
    this.stripe = new Stripe(this.configService.get("STRIPE_SECRET_KEY"));
  }

  calculatePlatformFee(price: number, commissionPercentage: number) {
    return (commissionPercentage / 100) * price;
  }

  async createCheckoutSessionUrl({
    currency,
    assetDetails: { name, images, _id, sellerId, tokens, isAdminAsset },
    tokenCount,
    stripeAccountId,
    price,
    buyerId,
    listingId = "",
  }: CreatePaymentDetails): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const commissionPrice = this.calculatePlatformFee(
      price,
      COMMISSION_PERCENTAGE,
    );
    price += commissionPrice;
    const sanitizedAmount = this.sanitizeAndValidateAmount(price);

    return this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,

            product_data: {
              name: name,
              images: images,
            },
            unit_amount: sanitizedAmount,
          },
          quantity: tokenCount,
        },
      ],
      mode: "payment",
      cancel_url: STRIPE_URLS.CHECKOUT.CANCEL_URL,
      success_url: STRIPE_URLS.CHECKOUT.SUCCESS_URL,
      payment_intent_data: {
        ...(!isAdminAsset
          ? {
              transfer_data: { destination: stripeAccountId },
              application_fee_amount:
                this.sanitizeAndValidateAmount(commissionPrice),
            }
          : {}),
        metadata: {
          buyerId,
          assetId: _id.toString(),
          sellerId: sellerId.toString(),
          totalTokenCount: tokens,
          tokenCount,
          listingId,
        },
      },
    });
  }

  private sanitizeAndValidateAmount(amount: number) {
    const amountInCents = Math.round(amount * 100);

    if (amountInCents <= 0) {
      throw new Error(ERROR_MESSAGES.RESPONSES.STRIPE.NEGATIVE_AMOUNT);
    }

    if (amountInCents > MAX_AMOUNT) {
      throw new Error(ERROR_MESSAGES.RESPONSES.STRIPE.MAX_AMOUNT);
    }
    return amountInCents;
  }

  async createStripeAccount(
    stripeAccountDetails: CreateStripeAccount,
  ): Promise<Stripe.Response<Stripe.Account>> {
    return this.stripe.accounts.create({
      email: stripeAccountDetails.email,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
      },
      controller: {
        fees: {
          payer: "application",
        },
        losses: {
          payments: "application",
        },
        stripe_dashboard: {
          type: "express",
        },
      },
    });
  }

  async getThePaymentIntentId(
    checkoutSessionId: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    return this.stripe.checkout.sessions.retrieve(checkoutSessionId);
  }

  async createOnboardingOrUpdateUrl(
    stripAccountId: string,
    detailsToUpdate?: DetailsToUpdate,
  ): Promise<Stripe.Response<Stripe.AccountLink>> {
    return this.stripe.accountLinks.create({
      account: stripAccountId,
      refresh_url: STRIPE_URLS.CHECKOUT.REFRESH_URL,
      return_url: STRIPE_URLS.CHECKOUT.RETURN_URL,
      type: "account_onboarding",
      ...(detailsToUpdate
        ? { collect: this.determineCollectType(detailsToUpdate) }
        : undefined),
    });
  }

  private determineCollectType(
    detailsToUpdate: DetailsToUpdate,
  ): Stripe.AccountLinkCreateParams.Collect {
    if (!detailsToUpdate.chargesEnabled || !detailsToUpdate.payoutsEnabled) {
      return "currently_due";
    }

    return "eventually_due";
  }

  async getAccountDetails(
    accountId: string,
  ): Promise<Stripe.Response<Stripe.Account>> {
    return this.stripe.accounts.retrieve(accountId);
  }

  async getAccountStatus(accountId: string): Promise<AccountStatusResponse> {
    const account = await this.getAccountDetails(accountId);

    return {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: {
        currentlyDue: account.requirements.currently_due,
        eventuallyDue: account.requirements.eventually_due,
        pastDue: account.requirements.past_due,
        pendingVerification: account.requirements.pending_verification,
      },
      capabilities: account.capabilities,
    };
  }

  async handleStripeWebhook({ requestPayload }: WebhookHandlerInterface) {
    switch (requestPayload.type) {
      case STRIP_WEBHOOK_EVENTS.PAYMENTS_INTENT_SUCCEEDED: {
        try {
          const paymentIntentId = (
            requestPayload.data.object as Stripe.PaymentIntent
          ).id;
          const paymentDetails =
            await this.stripe.paymentIntents.retrieve(paymentIntentId);
          const {
            assetId,
            sellerId,
            buyerId,
            tokenCount,
            totalTokenCount,
            listingId,
          } = paymentDetails.metadata;
          const amount = Number(paymentDetails.amount) / 100;
          const paymentDBParams: Payment = {
            amount: amount,
            transactionId: paymentIntentId,
            paymentStatus: PAYMENT_STATUS.COMPLETED,
            paymentMethod: PAYMENT_METHOD.STRIPE,
            assetId: new mongoose.Types.ObjectId(assetId),
            buyerId: new mongoose.Types.ObjectId(buyerId),
            quantity: Number(tokenCount),
            sellerId: new mongoose.Types.ObjectId(sellerId),
            commissionPercentage: COMMISSION_PERCENTAGE,
            platformFee: this.calculatePlatformFee(
              amount,
              COMMISSION_PERCENTAGE,
            ),
          };
          const createdPaymentDetails =
            await this.paymentRepository.create(paymentDBParams);

          const buyer = await this.userRepository.findOneById(
            new Types.ObjectId(buyerId),
          );
          await this.sendGridService.sendMail(
            buyer.email,
            EMAIL_CONSTANT.PAYMENT.SUBJECT,
            EMAIL_CONSTANT.PAYMENT.TEMPLATE,
            {
              amount: amount,
              tokenCount: tokenCount,
              assetId: assetId,
              transactionId: paymentIntentId,
              userName: buyer.firstName + " " + buyer.lastName,
              paymentStatus: PAYMENT_STATUS.COMPLETED,
            },
          );

          try {
            await this.NotificationModel.insertOne({
              message: NOTIFICATION_TEMPLATES.payments(amount),
              receiverId: new Types.ObjectId(buyerId),
            });

            const admins = await this.adminModel.find();
            const adminsNotification = admins.map((admin) => ({
              message: NOTIFICATION_TEMPLATES.payments_notify_admin(amount),
              receiverId: admin._id,
            }));

            await this.NotificationModel.insertMany(adminsNotification);
          } catch (error) {}

          const rewardPointsEarned = Math.floor(amount / 100) * 500;

          if (amount > 100 && rewardPointsEarned > 0) {
            await this.userRepository.incrementRewardPoints(
              new mongoose.Types.ObjectId(buyerId),
              rewardPointsEarned,
            );
            await this.rewardsModel.create({
              buyerId: new mongoose.Types.ObjectId(buyerId),
              assetId: new mongoose.Types.ObjectId(assetId),
              rewardPoints: rewardPointsEarned,
            });
          }

          if (!listingId) {
            const tokenDbParams: Token[] = Array.from(
              { length: Number(tokenCount) },
              () => ({
                assetId: new mongoose.Types.ObjectId(assetId),
                buyerId: new mongoose.Types.ObjectId(buyerId),
                tokenId: generateUniqueId(6),
                transactionId: createdPaymentDetails._id,
              }),
            );

            await this.tokenRepository.createMany(tokenDbParams);
            const totalCount = await this.tokenRepository.getTotalCount({
              assetId: assetId,
            });

            if (totalCount === Number(totalTokenCount))
              await this.assetRepository.findAndUpdateById(assetId, {
                sold: true,
                soldAt: new Date(),
                status: AssetStatus.SOLD,
              });
          } else {
            const tokensList = await this.tokenRepository.findAll({
              assetId: new mongoose.Types.ObjectId(assetId),
              buyerId: new mongoose.Types.ObjectId(sellerId),
            });

            if (tokensList.length < Number(tokenCount)) {
              throw new Error("Not enough tokens available to buy.");
            }

            const tokensToTransfer = tokensList.slice(0, Number(tokenCount));

            const transactionId = createdPaymentDetails._id;

            const tokenTransactionParams = tokensToTransfer.map((token) => ({
              tokenId: token.tokenId,
              fromBuyerId: new mongoose.Types.ObjectId(sellerId),
              toBuyerId: new mongoose.Types.ObjectId(buyerId),
              pricePerToken: amount / Number(tokenCount),
              transactionId,
            }));

            await this.tokenTransactionModel.insertMany(tokenTransactionParams);

            await this.assetListingModel.updateOne(
              { _id: listingId },
              {
                $inc: {
                  tokens: -tokenCount,
                  tokenPrice: -Number(paymentDetails.amount) / 100,
                },
              },
            );

            const updatedListing =
              await this.assetListingModel.findById(listingId);

            if (updatedListing && updatedListing.tokens <= 0) {
              await this.assetListingModel.updateOne(
                { _id: listingId },
                { $set: { deletedAt: new Date() } },
              );
            }

            await Promise.all(
              tokensToTransfer.map((token) =>
                this.tokenRepository.update(
                  { tokenId: token.tokenId },
                  {
                    $set: {
                      buyerId: new mongoose.Types.ObjectId(buyerId),
                      transactionId: transactionId,
                    },
                  },
                ),
              ),
            );
          }
        } catch (error) {
          Logger.error(
            `Error in the updating successful payment paymentIntentId:${(requestPayload?.data?.object as Stripe.PaymentIntent)?.id} `,
            error,
          );
        }
        break;
      }
      case STRIP_WEBHOOK_EVENTS.PAYMENTS_INTENT_FAILED: {
        try {
          const paymentIntentId = (
            requestPayload.data.object as Stripe.PaymentIntent
          ).id;
          const paymentDetails =
            await this.stripe.paymentIntents.retrieve(paymentIntentId);

          const { assetId, sellerId, buyerId, tokenIds } =
            paymentDetails.metadata;

          const paymentDBParams: Payment = {
            amount: paymentDetails.amount,
            transactionId: paymentIntentId,
            paymentStatus: PAYMENT_STATUS.FAILED,
            paymentMethod: PAYMENT_METHOD.STRIPE,
            assetId: new mongoose.Types.ObjectId(assetId),
            buyerId: new mongoose.Types.ObjectId(buyerId),
            quantity: JSON.parse(tokenIds).length,
            sellerId: new mongoose.Types.ObjectId(sellerId),
            commissionPercentage: COMMISSION_PERCENTAGE,
            platformFee: this.calculatePlatformFee(
              paymentDetails.amount,
              COMMISSION_PERCENTAGE,
            ),
          };

          await this.paymentRepository.create(paymentDBParams);
        } catch (error) {
          Logger.error(
            `Error in the updating failed payment paymentIntentId:${(requestPayload?.data?.object as Stripe.PaymentIntent)?.id} `,
            error,
          );
        }
        break;
      }
    }
    return "OK";
  }

  async createStripeLoginLink(stripeAccountId: string) {
    return await this.stripe.accounts.createLoginLink(stripeAccountId);
  }

  async isAccountOnboarded(accountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      const transfersStatus = account.capabilities?.transfers;

      if (transfersStatus === "active") {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
