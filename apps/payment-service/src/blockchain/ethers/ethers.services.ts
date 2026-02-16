/* eslint-disable prettier/prettier */
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";

import { ethers } from "ethers";
import mongoose, { Model } from "mongoose";
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
import { NOTIFICATION_TEMPLATES } from "src/shared-kernel/utils/constants/notification-template";
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "src/shared-kernel/utils/constants/transactions";
import { COMMISSION_PERCENTAGE } from "src/stripe/constants/max-amount";
import { UserRepository } from "src/users/repositories/user.repository";

import * as MARKETPLACE_ABI from "../constants/abis/marketplace.json";

@Injectable()
export class EtherService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(
    @InjectModel(TokenTransaction.name)
    private readonly tokenTransactionModel: Model<TokenTransaction>,
    @InjectModel(AssetListing.name)
    private readonly assetListingModel: Model<AssetListing>,
    @InjectModel(Rewards.name)
    private readonly rewardsModel: Model<Rewards>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
    private readonly configService: ConfigService,
    private readonly paymentRepository: PaymentRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly assetRepository: AssetRepository,
    private readonly userRepository: UserRepository,
    private readonly sendGridService: SendGridServices,
  ) {}

  onModuleInit() {
    this.initializeProvider();
    this.setupEventListeners();
  }

  private initializeProvider() {
    const rpcUrl = this.configService.get("AMOY_RPC_URL");
    const contractAddress = this.configService.get("PUBLIC_MARKETPLACE_PROXY");

    if (rpcUrl.startsWith("wss://")) {
      this.provider = new ethers.WebSocketProvider(rpcUrl, {
        chainId: 80002,
        name: "amoy",
      }) as any;
    } else {
      this.provider = new ethers.JsonRpcProvider(rpcUrl, {
        chainId: 80002,
        name: "amoy",
      });
    }

    this.contract = new ethers.Contract(
      contractAddress,
      MARKETPLACE_ABI.abi,
      this.provider,
    );
  }

  private setupEventListeners() {
    Logger.log("Setting up blockchain event listeners...");

    // Remove existing listeners to avoid duplicates
    this.contract.removeAllListeners();

    this.contract.on("SaleCompleted", async (...args) => {

      const transactionHash = args[args.length - 1].log.transactionHash;
      const [
        rawContractListingId,
        buyerWalletAddress,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _sellerWalletAddress,
        rawQuantity,
        totalPrice,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _platformFee,
        rawAssetListingId,
      ] = args.slice(0, -1);
      const quantity = Number(rawQuantity);
      const contractListingId = Number(rawContractListingId);
      const listingId = rawAssetListingId
        ? new mongoose.Types.ObjectId(String(Number(rawAssetListingId)))
        : rawAssetListingId;

      try {
        const [assetDetails, buyerDetails] = await Promise.all([
          this.assetRepository.findOne({
            ContractListingId: String(Number(contractListingId)),
          }),
          this.userRepository.findOne({
            walletAddress: buyerWalletAddress,
          }),
          // this.assetListingModel.findOne({
          //   _id: listingId,
          // }),
        ]);

        const amount = Number(totalPrice) / 10 ** 6;
        const paymentStatus = await this.getTransactionStatus(
          this.provider,
          transactionHash,
        );
        const paymentDBParams: Payment = {
          amount: amount,
          transactionId: transactionHash,
          paymentStatus,
          paymentMethod: PAYMENT_METHOD.WALLET,
          assetId: assetDetails._id as mongoose.Types.ObjectId,
          buyerId: buyerDetails._id,
          quantity,
          sellerId: new mongoose.Types.ObjectId(String(assetDetails.sellerId)),
          commissionPercentage: COMMISSION_PERCENTAGE,
          platformFee: this.calculatePlatformFee(amount, COMMISSION_PERCENTAGE),
        };

        if (paymentStatus === PAYMENT_STATUS.FAILED) {
          await this.paymentRepository.create(paymentDBParams);
          return;
        }
        const createdPaymentDetails =
          await this.paymentRepository.create(paymentDBParams);

        await this.sendGridService.sendMail(
          buyerDetails.email,
          EMAIL_CONSTANT.PAYMENT.SUBJECT,
          EMAIL_CONSTANT.PAYMENT.TEMPLATE,
          {
            amount: amount,
            tokenCount: quantity,
            assetId: assetDetails.assetId,
            transactionId: transactionHash,
            userName: buyerDetails.firstName + " " + buyerDetails.lastName,
            paymentStatus,
          },
        );

        try {
          await this.notificationModel.insertOne({
            message: NOTIFICATION_TEMPLATES.payments(amount),
            receiverId: buyerDetails._id,
          });
          const admins = await this.adminModel.find();
          const adminsNotification = admins.map((admin) => ({
            message: NOTIFICATION_TEMPLATES.payments_notify_admin(amount),
            receiverId: admin._id,
          }));

          await this.notificationModel.insertMany(adminsNotification);
        } catch (error) {
          Logger.error(
            "Error in inserting in notification and admin model ",
            error,
          );
        }

        const rewardPointsEarned = Math.floor(amount) * 500;

        if (amount > 100 && rewardPointsEarned > 0) {
          await this.userRepository.incrementRewardPoints(
            buyerDetails._id,
            rewardPointsEarned,
          );
          await this.rewardsModel.create({
            buyerId: buyerDetails._id,
            assetId: assetDetails._id as mongoose.Types.ObjectId,
            rewardPoints: rewardPointsEarned,
          });
        }

        if (!listingId) {
          const tokenDbParams: Token[] = Array.from(
            { length: Number(quantity) },
            () => ({
              assetId: assetDetails._id as mongoose.Types.ObjectId,
              buyerId: buyerDetails._id,
              tokenId: generateUniqueId(6),
              transactionId: createdPaymentDetails._id,
            }),
          );

          await this.tokenRepository.createMany(tokenDbParams);
          const totalCount = await this.tokenRepository.getTotalCount({
            assetId: assetDetails._id,
          });

          if (totalCount === Number(assetDetails.tokens))
            await this.assetRepository.findAndUpdateById(
              String(assetDetails._id),
              {
                sold: true,
                soldAt: new Date(),
                status: AssetStatus.SOLD,
              },
            );
        } else {
          const tokensList = await this.tokenRepository.findAll({
            assetId: assetDetails._id,
            buyerId: buyerDetails.id,
          });

          if (tokensList.length < Number(quantity)) {
            throw new Error("Not enough tokens available to buy.");
          }

          const tokensToTransfer = tokensList.slice(0, Number(quantity));

          const transactionId = createdPaymentDetails._id;
          Logger.log("check7");
          const tokenTransactionParams = tokensToTransfer.map((token) => ({
            tokenId: token.tokenId,
            fromBuyerId: new mongoose.Types.ObjectId(
              String(assetDetails.sellerId),
            ),
            toBuyerId: buyerDetails._id,
            pricePerToken: amount / Number(quantity),
            transactionId,
          }));

          await this.tokenTransactionModel.insertMany(tokenTransactionParams);
          await this.assetListingModel.updateOne(
            { _id: listingId },
            {
              $inc: {
                tokens: -quantity,
                tokenPrice: -Number(amount),
                contractListingId: contractListingId,
                sellerAddress: _sellerWalletAddress,
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
                    buyerId: buyerDetails._id,
                    transactionId: transactionId,
                  },
                },
              ),
            ),
          );
        }
      } catch (error) {
        Logger.error(
          `Error in the updating successful payment transactionHash:${transactionHash} `,
          error,
        );
      }
    });

    this.contract.on(
      "ListingUpdated",
      async (
        ContractListingId,
        listingType,
        collectionId,
        tokenContract,
        seller,
        newAmount,
        newPricePerToken,
        rawAssetListingId,
      ) => {
        try {
          console.log("ListingUpdated event received:", {
            ContractListingId,
            listingType,
            collectionId,
            tokenContract,
            seller,
            newAmount,
            newPricePerToken,
            rawAssetListingId,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const contractListingId = Number(ContractListingId);

          const listingId = rawAssetListingId
            ? new mongoose.Types.ObjectId(String(Number(rawAssetListingId)))
            : rawAssetListingId;

          await this.assetListingModel.updateOne(
            { _id: listingId.toString() },
            {
              $inc: {
                tokens: Number(newAmount),
                tokenPrice: -Number(newPricePerToken),
                sellerAddress: seller,
              },
            },
          );
        } catch (error) {
          console.error("Error handling ListingUpdated event:", error);
        }
      },
    );

    // Error handling to recovery from "resource not found" or other RPC issues
    this.provider.on("error", (error) => {
      Logger.error("Ethers provider error detected:", error);
      if (
        error?.code === -32001 ||
        error?.message?.includes("resource not found") ||
        error?.message?.includes("filter not found")
      ) {
        Logger.warn("Filter expired or not found. Re-initializing listeners...");
        this.setupEventListeners();
      }
    });

    // Handle WebSocket disconnection if applicable
    if (this.provider instanceof ethers.WebSocketProvider) {
      (this.provider.websocket as any).onclose = () => {
        Logger.error("WebSocket connection closed. Reconnecting...");
        setTimeout(() => {
          this.initializeProvider();
          this.setupEventListeners();
        }, 5000);
      };
    }
  }



  calculatePlatformFee(price: number, commissionPercentage: number) {
    return (commissionPercentage / 100) * price;
  }

  async getTransactionStatus(
    provider: ethers.JsonRpcProvider,
    txHash: string,
    retry = 1,
  ) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return PAYMENT_STATUS.PENDING;
      }

      if (receipt.status === 1) {
        return PAYMENT_STATUS.COMPLETED;
      } else if (receipt.status === 0) {
        return PAYMENT_STATUS.FAILED;
      }
    } catch (error) {
      if (retry <= 3) {
        Logger.warn(
          `Retrying getTransactionStatus function, retry count : ${retry}`,
        );
        // Wait for two seconds, for rate limiting issue with infura url
        await new Promise((res) => setTimeout(res, 2000));
        return this.getTransactionStatus(provider, txHash, ++retry);
      } else {
        Logger.error("Error in getting the getting transaction status", error);
        return PAYMENT_STATUS.PENDING;
      }
    }
  }
}
