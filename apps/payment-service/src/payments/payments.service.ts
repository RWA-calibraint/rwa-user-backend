import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";

import mongoose, { Model } from "mongoose";

import { AssetRepository } from "src/assets/repositories/asset.repository";
import { AssetListingRepository } from "src/assets/repositories/assetListing.repository";
import { TokenRepository } from "src/assets/repositories/token.repository";
import { Rewards } from "src/assets/schemas/rewards.schema";
import { CreatePayment } from "src/payments/interface";
import { PaymentRepository } from "src/payments/repositories/payment.repository";
import { ERROR_MESSAGES } from "src/shared-kernel/utils/constants/exceptions/error-message";
import { PAYMENT_STATUS } from "src/shared-kernel/utils/constants/transactions";
import { StripeService } from "src/stripe/stripe.service";
import { UserRepository } from "src/users/repositories/user.repository";
import { UserDocument } from "src/users/schema/user.schema";

import { GetOrdersParams } from "./interface/get-orders.interace";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Rewards.name)
    private readonly userRewards: Model<Rewards>,
    private readonly stripeService: StripeService,
    private readonly paymentRepository: PaymentRepository,
    private readonly userRepository: UserRepository,
    private readonly assetRepository: AssetRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly configService: ConfigService,
    private readonly assetListingRepository: AssetListingRepository,
  ) {}

  async buyTheAsset(
    { assetId, currency, tokenCount, listingId }: CreatePayment,
    { _id: buyerId }: UserDocument,
  ): Promise<string> {
    try {
      if (!listingId) {
        const [buyerDetails, assetDetails, tokenDetails] = await Promise.all([
          this.userRepository.findOneById(buyerId),
          this.assetRepository.findById(assetId),
          this.tokenRepository.findAll({ assetId: assetId, buyerId: buyerId }),
        ]);

        const sellerDetails = await this.userRepository.findOneById(
          assetDetails.sellerId,
        );
        if (!sellerDetails && !assetDetails.isAdminAsset)
          throw new Error(ERROR_MESSAGES.RESPONSES.SELLER_NOT_FOUND);
        if (!buyerDetails)
          throw new Error(ERROR_MESSAGES.RESPONSES.BUYER_NOT_FOUND);
        if (!assetDetails)
          throw new Error(ERROR_MESSAGES.RESPONSES.ASSET_NOT_FOUND);
        if (
          tokenDetails.length + tokenCount >
          Math.floor(0.6 * assetDetails.tokens)
        )
          throw new Error(ERROR_MESSAGES.RESPONSES.TOKEN.TOKEN_UNAVAILABLE);

        const calculatedAmount = assetDetails.price / assetDetails.tokens;

        const { url } = await this.stripeService.createCheckoutSessionUrl({
          currency,
          assetDetails,
          stripeAccountId:
            sellerDetails?.stripeAccountId ??
            this.configService.get("RAREAGORA_STRIPE_ACCOUNT_ID"),
          price: calculatedAmount,
          buyerId: buyerId.toString(),
          tokenCount,
        });

        return url;
      } else {
        const [buyerDetails, assetDetails, assetListingDetails] =
          await Promise.all([
            this.userRepository.findOneById(buyerId),
            this.assetRepository.findById(assetId),
            this.assetListingRepository.findById(listingId),
          ]);

        assetDetails.sellerId = assetListingDetails.sellerId;
        const sellerDetails = await this.userRepository.findOneById(
          assetListingDetails.sellerId,
        );
        if (!sellerDetails && !assetDetails.isAdminAsset)
          throw new Error(ERROR_MESSAGES.RESPONSES.SELLER_NOT_FOUND);
        if (!buyerDetails)
          throw new Error(ERROR_MESSAGES.RESPONSES.BUYER_NOT_FOUND);
        if (!assetDetails)
          throw new Error(ERROR_MESSAGES.RESPONSES.ASSET_NOT_FOUND);

        const calculatedAmount =
          assetListingDetails.tokenPrice / assetListingDetails.tokens;

        const { url } = await this.stripeService.createCheckoutSessionUrl({
          currency,
          assetDetails,
          stripeAccountId:
            sellerDetails?.stripeAccountId ??
            this.configService.get("RAREAGORA_STRIPE_ACCOUNT_ID"),
          price: calculatedAmount,
          buyerId: buyerId.toString(),
          tokenCount,
          listingId: listingId,
        });

        return url;
      }
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async getAssetOrders({
    userId,
    searchValue,
    categories,
    from,
    paymentStatus,
    to,
    page = 1,
    size = 10,
  }: GetOrdersParams) {
    try {
      const skip = (page - 1) * size;

      const filters = [];

      if (searchValue) {
        filters.push({
          $match: { "asset.name": { $regex: searchValue, $options: "i" } },
        });
      }

      if (categories?.length) {
        filters.push({
          $match: {
            "category.category": {
              $in: categories,
            },
          },
        });
      }

      if (from && to) {
        filters.push({
          $match: {
            createdAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          },
        });
      }

      const basePipeline = [
        {
          $match: {
            paymentStatus: paymentStatus ?? PAYMENT_STATUS.COMPLETED,
            $or: [
              { buyerId: new mongoose.Types.ObjectId(userId) },
              { sellerId: new mongoose.Types.ObjectId(userId) },
            ],
          },
        },
        {
          $lookup: {
            from: "assets",
            localField: "assetId",
            foreignField: "_id",
            as: "asset",
          },
        },
        { $unwind: "$asset" },
        {
          $addFields: {
            categoryObjId: { $toObjectId: "$asset.category" },
            orderType: {
              $cond: {
                if: { $eq: ["$sellerId", new mongoose.Types.ObjectId(userId)] },
                then: "Sell",
                else: "Buy",
              },
            },
          },
        },
        {
          $lookup: {
            from: "assetcategories",
            localField: "categoryObjId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        { $sort: { createdAt: -1 } },

        ...filters,
      ];

      const countPipeline = [...basePipeline, { $count: "totalCount" }];

      const resultPipeline = [
        ...basePipeline,

        { $skip: skip },
        { $limit: size },
      ];

      const [countResult, results] = await Promise.all([
        this.paymentRepository.findWithAggregate(countPipeline),
        this.paymentRepository.findWithAggregate(resultPipeline),
      ]);

      const totalCount = countResult[0]?.totalCount || 0;

      return {
        data: results,
        page,
        size,
        total: totalCount,
        totalPages: Math.ceil(totalCount / size),
      };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async userRewardsList(userId: string) {
    try {
      const result = await this.userRewards
        .find({ buyerId: new mongoose.Types.ObjectId(userId) })
        .populate("assetId")
        .sort({ createdAt: -1 })
        .limit(5);
      return result;
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }
}
