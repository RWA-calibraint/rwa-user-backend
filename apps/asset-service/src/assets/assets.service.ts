import { Injectable, NotFoundException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";

import mongoose, { Model, Types } from "mongoose";
import * as QRCode from "qrcode";

import { AssetWithDocuments } from "src/assets/interface/assets.interface";
import { AssetRepository } from "src/assets/repository/asset.repository";
import { ExclusiveAccessRepository } from "src/assets/repository/exclusive-access.repository";
import {
  AssetDraft,
  AssetDraftDocument,
} from "src/assets/schemas/asset-draft.schema";
import { Asset, AssetDocument } from "src/assets/schemas/asset.schema";
import { ExclusiveAccess } from "src/assets/schemas/exclusive-access.schema";
import { PriceHistory } from "src/assets/schemas/price_history.schema";
import { WishlistAsset } from "src/assets/schemas/wishlist.schema";
import {
  Document,
  documentReportStatus,
} from "src/documents/schemas/document.schema";
import {
  AssetStatus,
  COLLECTION_TYPE,
  constructAssetStatus,
} from "src/shared-kernel/constants/asset-context";
import { NOTIFICATION_TEMPLATES } from "src/shared-kernel/constants/notification-template";
import { ERROR_MESSAGES } from "src/shared-kernel/error-mesaage";
import { getStatusByEnum } from "src/shared-module/constants/constants";
import { EMAIL_CONSTANTS } from "src/shared-module/constants/email-constants";
import { NotificationService } from "src/shared-module/notification/notification.service";
import { S3Service } from "src/shared-module/S3/s3.service";
import { SendGridServices } from "src/shared-module/send-grid/send-grid.services";
import { convertUsdToPol } from "src/utils/helper";
import { paginate } from "src/utils/pagination.util";

import { AssetListingDto } from "./dto/asset-listing.dto";
import { AssetStatusDto, STATUS_TYPE } from "./dto/asset-status.dto";
import { AssetsDraftDto } from "./dto/assets-draft.dto";
import { CreateAssetDto, DocumentInterface } from "./dto/create-asset.dto";
import { GetSoldAssetByUser } from "./interface/sold-asset.interface";
import { TokenRepository } from "./repository/token.repository";
import {
  AssetListing,
  AssetListingDocument,
} from "./schemas/asset-listing.schema";
import { AssetCategory } from "./schemas/category.schema";
import { Token, TokenDocument } from "./schemas/token.schema";
import { UserDocument } from "./schemas/user.schema";

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name) private readonly assetModel: Model<Asset>,
    @InjectModel(Document.name) private readonly documentModel: Model<Document>,
    @InjectModel(AssetDraft.name)
    private readonly assetDraftModel: Model<AssetDraftDocument>,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(WishlistAsset.name)
    private readonly wishlistAssetModel: Model<WishlistAsset>,
    @InjectModel(PriceHistory.name)
    private readonly priceHistoryModel: Model<PriceHistory>,
    @InjectModel(AssetCategory.name)
    private readonly assetCategoryModel: Model<AssetCategory>,
    @InjectModel(AssetListing.name)
    private readonly assetListingModel: Model<AssetListingDocument>,
    private readonly s3Service: S3Service,
    private readonly assetRepository: AssetRepository,
    private readonly exclusiveAccessRepository: ExclusiveAccessRepository,
    private readonly sendGridServices: SendGridServices,
    private readonly notificationService: NotificationService,
    private readonly tokenRepository: TokenRepository,
  ) {}

  async create(
    assetDto: CreateAssetDto,
    coverImageUrl,
    imageUrls,
    userId: string,
  ) {
    const assetDbData = {
      ...assetDto,
      coverImage: coverImageUrl,
      images: imageUrls,
      sellerId: userId,
      isAdminAsset: true,
    };
    const asset = new this.assetModel(assetDbData);
    const createdAsset: AssetDocument = await asset.save();

    const notification = {
      message: NOTIFICATION_TEMPLATES.submitNewAsset(assetDto.name),
    };
    await this.notificationService.notifyAdmin(notification);

    // await this.assetDraftModel.deleteMany({
    //   userId: new Types.ObjectId(userId),
    // });

    return await Promise.all(
      Object.entries(assetDto.documents).flatMap(([key, documents]) =>
        documents.map(({ name, url }: DocumentInterface) =>
          new this.documentModel({
            assetId: createdAsset?.assetId,
            type: key,
            documentName: name,
            documentUrl: url,
          }).save(),
        ),
      ),
    );
  }

  async createDocument(file: Express.Multer.File) {
    return await this.s3Service.uploadFile(file.path, file?.mimetype);
  }

  async findAll(page: number, limit: number, search?: string) {
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    const result = await paginate<Asset>(
      this.assetModel,
      page,
      limit,
      filter,
      { createdAt: -1 },
      ["category"],
    );
    result.data = result.data.map((item: any) => ({
      assetId: item._id,
      ...item.toObject(),
      _id: undefined,
    }));
    return result;
  }

  async fetchLiveAssets(userId?: string): Promise<any> {
    const result = await this.assetModel.aggregate([
      {
        $match: {
          deletedAt: null,
          status: { $in: [AssetStatus.LIVE, AssetStatus.SOLD] },
          isFeaturedAsset: false,
        },
      },
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", AssetStatus.LIVE] }, then: 0 },
                { case: { $eq: ["$status", AssetStatus.SOLD] }, then: 1 },
              ],
              default: 2,
            },
          },
        },
      },
      {
        $sort: {
          statusOrder: 1,
          listedDate: -1,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    let likedAssetIdSet: Set<string> | null = null;

    if (userId) {
      const likedAssets = await this.wishlistAssetModel.find(
        {
          assetId: { $in: result.map((asset) => asset._id) },
          userId: userId,
        },
        { assetId: 1 },
      );
      likedAssetIdSet = new Set(
        likedAssets.map((like) => like.assetId.toString()),
      );
    }
    const liveAssetWithLikes = result.map((asset) => ({
      ...asset,
      isLiked: userId
        ? (likedAssetIdSet.has(asset._id.toString()) ?? false)
        : false,
    }));
    return liveAssetWithLikes;
  }

  async convertToLive(assetId: string): Promise<any> {
    return await this.assetModel.updateOne(
      { assetId },
      { $set: { status: "Live", listedDate: new Date() } },
    );
  }

  async findOne(
    assetId: string,
    userId: string,
  ): Promise<AssetWithDocuments | null> {
    const [documents, assetDetail] = await Promise.all([
      this.documentModel
        .find({ assetId }, "type documentUrl documentName assetId status")
        .lean(),
      this.assetModel
        .findOne({ assetId })
        .populate("category")
        .populate("sellerId")
        .lean(),
    ]);

    if (!assetDetail) return null;

    const [
      tokensBoughtByUser,
      priceHistory,
      soldTokens,
      likesCount,
      isLiked,
      assetListing,
      assetListingByuser,
      userListingActivity,
      assetListingActivity,
    ] = await Promise.all([
      this.tokenRepository.findAll({
        buyerId: new mongoose.Types.ObjectId(userId),
        assetId: new mongoose.Types.ObjectId(assetDetail._id),
      }),
      this.priceHistoryModel.find({ assetId }),
      this.tokenRepository.getTotalCount({ assetId: assetDetail._id }),
      this.wishlistAssetModel.countDocuments({ assetId: assetDetail._id }),
      this.wishlistAssetModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        assetId: assetDetail._id,
      }),
      this.assetListingModel
        .find({
          assetId: assetDetail._id,
          deletedAt: null,
          sellerId: { $ne: new mongoose.Types.ObjectId(userId) },
        })
        .populate("sellerId"),
      this.assetListingModel
        .find({
          assetId: assetDetail._id,
          deletedAt: null,
          sellerId: new mongoose.Types.ObjectId(userId),
        })
        .populate("sellerId"),
      this.assetListingModel
        .find({
          assetId: assetDetail._id,
          sellerId: new mongoose.Types.ObjectId(userId),
        })
        .populate("sellerId"),
      this.assetListingModel
        .find({
          assetId: assetDetail._id,
          sellerId: { $ne: new mongoose.Types.ObjectId(userId) },
        })
        .populate("sellerId"),
    ]);

    const userTokensCount = assetListingByuser.reduce((acc, listing) => {
      return acc + listing.tokens;
    }, 0);

    const toPlain = (doc: any) =>
      typeof doc.toObject === "function" ? doc.toObject() : doc;

    const userListings = assetListingByuser.map((listing) => ({
      ...toPlain(listing),
      userAsset: true,
    }));

    const mergedListings = [...userListings, ...assetListing.map(toPlain)];
    const activity = [
      ...userListingActivity,
      ...assetListingActivity.map(toPlain),
    ];
    const assetTokens = await this.tokenModel
      .find({ assetId: assetDetail._id })
      .sort({ createdAt: 1 })
      .populate("buyerId", "firstName")
      .lean<
        Array<{
          buyerId: {
            _id: mongoose.Types.ObjectId;
            firstName: string;
          };
          createdAt: Date;
        }>
      >();

    const assetOwners = assetTokens.reduce(
      (acc, token) => {
        const buyerId = token.buyerId._id.toString();

        if (!acc[buyerId]) {
          acc[buyerId] = {
            name: token.buyerId.firstName || "Unknown",
            tokenCount: 0,
            purchasedDate: token.createdAt.toISOString(),
          };
        }

        acc[buyerId].tokenCount++;
        return acc;
      },
      {} as Record<
        string,
        { name: string; tokenCount: number; purchasedDate: string }
      >,
    );

    return {
      ...assetDetail,
      _id: assetDetail._id.toString(),
      documents,
      priceHistory,
      soldTokens,
      tokensBought: tokensBoughtByUser.length,
      likesCount,
      isLiked: !!isLiked,
      listings: mergedListings,
      availableTokens: assetDetail.tokens - soldTokens,
      availableListingTokens: tokensBoughtByUser.length - userTokensCount,
      assetOwners: Object.values(assetOwners),
      listingActivity: activity,
    };
  }

  async update(
    assetId: string,
    assetDto: CreateAssetDto,
    coverImageUrl,
    imageUrls,
  ) {
    const existingDocuments = await this.documentModel.find({ assetId });
    const rejectedDocuments = existingDocuments.filter(
      (doc) => doc.status === documentReportStatus.REJECTED,
    );
    const replacedDocuments = [];
    assetDto["coverImage"] = coverImageUrl;
    assetDto.images = imageUrls;
    const assetDocuments = assetDto.documents;
    delete assetDto["documents"];

    if (Object.keys(assetDocuments).length > 0) {
      const newDocumentEntries = new Set<string>();

      const bulkOperations = Object.entries(assetDocuments).flatMap(
        ([type, documents]) =>
          documents.map(({ name, url }: DocumentInterface) => {
            const uniqueKey = `${name}_${type}`;
            newDocumentEntries.add(uniqueKey);

            const previouslyRejected = rejectedDocuments.find(
              (doc) => doc.documentName === name && doc.type === type,
            );

            if (previouslyRejected && previouslyRejected.documentUrl !== url) {
              replacedDocuments.push({
                name,
                type,
                oldUrl: previouslyRejected.documentUrl,
                newUrl: url,
              });
            }

            return {
              updateOne: {
                filter: { assetId, documentName: name, type },
                update: {
                  $set: {
                    type,
                    documentUrl: url,
                    status: documentReportStatus.PENDING,
                  },
                },
                upsert: true,
              },
            };
          }),
      );
      const notification = {
        message: NOTIFICATION_TEMPLATES.resubmitAsset(assetDto.name),
      };
      await this.notificationService.notifyAdmin(notification);
      await Promise.all([
        this.documentModel.deleteMany({
          assetId,
          $expr: {
            $not: {
              $in: [
                { $concat: ["$documentName", "_", "$type"] },
                Array.from(newDocumentEntries),
              ],
            },
          },
        }),
        this.documentModel.bulkWrite(bulkOperations),
      ]);
    }
    if (replacedDocuments.length > 0) {
      assetDto["status"] = STATUS_TYPE.RESUBMISSION;
    }
    await this.assetModel.updateOne({ assetId }, { $set: assetDto });
    return {
      message: "Asset updated successfully",
    };
  }

  async remove(assetId: string) {
    const asset = await this.assetModel.findOne({ assetId });
    if (!asset) {
      throw new NotFoundException(
        ERROR_MESSAGES.ASSET.ASSET_NOT_FOUND(assetId),
      );
    }

    asset.deletedAt = new Date();
    return asset.save();
  }

  findAssetTag(tagId: string) {
    return this.assetModel.findOne({ tag: tagId }).exec();
  }

  async qrCodeScan(assetId: string, qrCode: string) {
    const qrCodeData = await QRCode.toDataURL(qrCode);
    await this.assetModel
      .updateOne({ _id: assetId }, { $set: { qrCode: qrCodeData } })
      .exec();
    return qrCodeData;
  }

  findAssetByUser(userId: string) {
    return this.assetModel
      .findOne({ sellerId: userId })
      .populate("documents")
      .exec();
  }

  async getAllCategories() {
    return this.assetCategoryModel.find({}, "category");
  }

  async deleteListings(id: string) {
    return await this.assetListingModel.findByIdAndDelete(id);
  }

  async fetchImagesByAsset(categoryId: string) {
    const assets = await this.assetModel
      .find({ category: categoryId })
      .select("images -_id")
      .exec();

    return assets.flatMap((asset) => asset.images);
  }

  async fetchPriceHistory(assetId: string) {
    return await this.priceHistoryModel.find({ assetId });
  }

  async fetchWishlistAsset(
    userId: string,
    filters: string,
    pagination: string,
  ) {
    pagination = JSON.parse(pagination);
    filters = filters ? JSON.parse(filters) : "{}";
    const filterQuery = {};
    const sortBy = {};
    const skip = (pagination["currentPage"] - 1) * pagination["assetPerPage"];

    if (filters["searchValue"]) {
      filterQuery["name"] = {
        $regex: filters["searchValue"],
        $options: "i",
      };
    }

    if (filters["categories"] && filters["categories"]?.length > 0) {
      filterQuery["category"] = {
        $in: filters["categories"],
      };
    }

    if (filters["min"] && filters["max"] && filters["max"] > filters["min"]) {
      filterQuery["price"] = {
        ["$gte"]: filters["min"],
        ["$lte"]: filters["max"],
      };
    }

    switch (filters["sortBy"]) {
      case "price-low-to-high":
        sortBy["price"] = 1;
        break;
      case "price-high-to-low":
        sortBy["price"] = -1;
        break;
      case "recently-added":
        sortBy["createdAt"] = -1;
        break;
      default:
        sortBy["createdAt"] = -1;
    }

    const customAggregateStages = [
      {
        $addFields: {
          categoryObjectId: { $toObjectId: "$category" },
        },
      },
      {
        $lookup: {
          from: "assetcategories",
          localField: "categoryObjectId",
          foreignField: "_id",
          as: "categoryDoc",
        },
      },
      {
        $unwind: {
          path: "$categoryDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          category: "$categoryDoc.category",
        },
      },
      {
        $project: {
          categoryDoc: 0,
          categoryObjectId: 0,
        },
      },
      {
        $match: filterQuery,
      },
      {
        $sort: sortBy,
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: pagination["assetPerPage"] }],
          total: [{ $count: "count" }],
        },
      },
      {
        $unwind: {
          path: "$total",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          data: 1,
          total: "$total.count",
        },
      },
    ];

    const customResponse = {
      assets: [],
      currentPage: pagination["currentPage"],
      totalAssets: 0,
      assetPerPage: pagination["assetPerPage"],
    };

    const [result] = await this.wishlistAssetModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
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
        $replaceRoot: {
          newRoot: "$asset",
        },
      },
      ...customAggregateStages,
    ]);
    customResponse.assets = result.data;
    customResponse.totalAssets = result.total;
    return customResponse;
  }
  async fetchWishlistAssetCount(assetId: string) {
    const count = await this.wishlistAssetModel.countDocuments({ assetId });
    return { count };
  }

  async assetViews(userId: string, assetId: string) {
    return await this.assetModel.findByIdAndUpdate(
      assetId,
      {
        $addToSet: { viewedBy: new Types.ObjectId(userId) },
      },
      { new: true },
    );
  }

  async fecthAssetViewCount(assetId: string) {
    const asset = await this.assetModel.findById(assetId).select("viewedBy");
    return { count: asset?.viewedBy.length || 0 };
  }
  async fetchAssetListbyStatus(userId: string, query: AssetStatusDto) {
    const filter: any = {
      deletedAt: null,
    };
    const sortBy = {};
    filter.sellerId = userId;
    if (query.status) {
      filter.status = { $in: getStatusByEnum(query.status) };
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.category) {
      const categoryIds = Array.isArray(query.category)
        ? query.category
        : query.category.split(",");
      if (categoryIds.length) {
        filter.category = { $in: categoryIds };
      }
      filter.category = { $in: categoryIds };
    }

    if (query.startDate || query.endDate) {
      filter.updatedAt = {};
      if (query.startDate) {
        filter.updatedAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        filter.updatedAt.$lte = endDate;
      }
    }

    if (parseInt(query.min) > 0 && parseInt(query.max) > 0) {
      filter.price = {
        $gte: parseInt(query.min),
        $lte: parseInt(query.max),
      };
    }

    switch (query["sortBy"]) {
      case "price-low-to-high":
        sortBy["price"] = 1;
        break;
      case "price-high-to-low":
        sortBy["price"] = -1;
        break;
      case "recently-added":
        sortBy["createdAt"] = -1;
        break;
      default:
        sortBy["createdAt"] = -1;
    }

    const result = await paginate<Asset>(
      this.assetModel,
      query.page,
      query.limit,
      filter,
      sortBy,
      ["category", "sellerId"],
    );

    const getTokenCount = async (assetId: string) => {
      return this.tokenRepository.getTotalCount({ assetId, buyerId: userId });
    };

    const getRejectedDocCount = async (assetId: string) => {
      return this.documentModel.countDocuments({
        assetId,
        status: documentReportStatus.REJECTED,
      });
    };

    result.data = await Promise.all(
      result.data.map(async (item: any) => ({
        assetId: item._id,
        ...item.toObject(),
        tokenPrice: Math.round(Number(item.price) / (Number(item.tokens) || 1)),
        tokenSold: (await getTokenCount(item._id)) || 0,
        rejectedDocuments:
          query.status === STATUS_TYPE.ADJUSTMENT_REQUIRED
            ? await getRejectedDocCount(item.assetId)
            : 0,
        sellerName:
          [item.sellerId?.firstName, item.sellerId?.lastName]
            .filter(Boolean)
            .join(" ") || "N/A",
        category: item.category.category,
        coverImage: item.images[0],
        sellerId: undefined,
      })),
    );

    return result;
  }

  async wishlistAsset(userId: string, assetId: string) {
    const existingWishlistAsset = await this.wishlistAssetModel.findOne({
      userId,
      assetId,
    });

    if (existingWishlistAsset) {
      await this.wishlistAssetModel.deleteOne({ userId, assetId });
      return { message: "Asset removed from wishlist" };
    } else {
      const wishlistAsset = new this.wishlistAssetModel({
        userId,
        assetId,
      });
      return wishlistAsset.save();
    }
  }

  async getSoldAssets({
    userId,
    page,
    size,
    categories,
    from,
    searchValue,
    to,
    min,
    max,
    sortBy,
  }: GetSoldAssetByUser) {
    try {
      const skip = (page - 1) * size;

      const filters = [];
      const sortByFilter = {};

      if (searchValue) {
        filters.push({
          $match: { name: { $regex: searchValue, $options: "i" } },
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
            soldAt: {
              $gte: new Date(from),
              $lte: new Date(to),
            },
          },
        });
      }

      if (parseInt(min) && parseInt(max) && parseInt(max) > parseInt(min)) {
        filters.push({
          $match: {
            price: {
              $gte: parseInt(min),
              $lte: parseInt(max),
            },
          },
        });
      }

      switch (sortBy) {
        case "price-low-to-high":
          sortByFilter["price"] = 1;
          break;
        case "price-high-to-low":
          sortByFilter["price"] = -1;
          break;
        case "recently-added":
          sortByFilter["createdAt"] = -1;
          break;
        default:
          sortByFilter["createdAt"] = -1;
      }

      const basePipeline = [
        {
          $match: {
            sellerId: userId.toString(),
            sold: true,
          },
        },
        {
          $lookup: {
            from: "tokens",
            localField: "_id",
            foreignField: "assetId",
            as: "matchingTokens",
          },
        },
        {
          $addFields: {
            categoryObjId: { $toObjectId: "$category" },
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
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            category: "$category.category",
          },
        },
        ...filters,
        {
          $sort: sortByFilter,
        },
      ];

      const countPipeline = [...basePipeline, { $count: "totalCount" }];

      const resultPipeline = [
        ...basePipeline,
        { $skip: skip },
        { $limit: size },
      ];

      const [countResult, results] = await Promise.all([
        this.assetRepository.findWithAggregate(countPipeline),
        this.assetRepository.findWithAggregate(resultPipeline),
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
  async getSubmissionCount(userId: string) {
    const result = await this.assetModel.aggregate([
      {
        $match: { sellerId: userId, deletedAt: null },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);
    return constructAssetStatus(result);
  }

  async submitExclusiveAccess(
    { _id: userId, email }: UserDocument,
    assetId: mongoose.Types.ObjectId,
  ): Promise<ExclusiveAccess> {
    try {
      const [assetDetails, userAlreadyAccessed] = await Promise.all([
        this.assetRepository.findOne({ _id: assetId }),
        this.exclusiveAccessRepository.find({
          userId,
          assetId,
        }),
      ]);

      if (!assetDetails || userAlreadyAccessed)
        throw new Error(
          !assetDetails
            ? ERROR_MESSAGES.ASSET_NOT_FOUND
            : ERROR_MESSAGES.EXCLUSIVE_ACCESS.ALREADY_ACCESSED,
        );

      const { SUBJECT: emailSubject, TEMPLATE_FILE_KEY: templateFileKey } =
        EMAIL_CONSTANTS.ASSET.EXCLUSIVE_ACCESS;

      const subscribers = await this.exclusiveAccessRepository.count({
        assetId: assetId.toString(),
      });

      let assetDescription = JSON.parse(assetDetails.description);
      if (assetDescription && assetDescription[0]) {
        assetDescription = assetDescription[0].children[0].text;
      }

      const polPrice = await convertUsdToPol(assetDetails.price);

      const [assetPriceChange] = await this.priceHistoryModel.aggregate([
        {
          $match: {
            assetId: assetDetails.assetId,
          },
        },
        {
          $sort: { year: 1 },
        },
        {
          $group: {
            _id: "$assetId",
            sinceYear: { $first: "$year" },
            initialPrice: { $first: { $toDouble: "$price" } },
            currentPrice: { $last: { $toDouble: "$price" } },
          },
        },
        {
          $project: {
            _id: 0,
            sinceYear: 1,
            percentage: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ["$currentPrice", "$initialPrice"] },
                        "$initialPrice",
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
      ]);

      const assetPricePercentage = assetPriceChange?.percentage || 0;

      const emailBodyData = {
        assetImage: assetDetails.images[0],
        name: assetDetails.name,
        description: assetDescription,
        assetPrice: assetDetails.price,
        polPrice: polPrice,
        subscribers: subscribers,
        assetLink: `https://dev.rareagora.com/asset/${assetDetails.assetId}?isFeaturedAsset=true`,
        sinceYear: assetPriceChange?.sinceYear || null,
        growthPercent:
          assetPricePercentage > 0
            ? `+${assetPricePercentage}`
            : assetPricePercentage < 0
              ? `-${assetPricePercentage}`
              : 0,
        growth:
          assetPricePercentage === 0
            ? "neutral"
            : assetPricePercentage >= 0
              ? "increased"
              : "decreased",
      };
      await this.sendGridServices.sendMail(
        email,
        emailSubject,
        templateFileKey,
        emailBodyData,
      );
      return this.exclusiveAccessRepository.create(userId, assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }
  async getFeatureAsset(userId?: string) {
    try {
      const featureAssets = await this.assetModel.aggregate([
        {
          $match: {
            isAdminAsset: true,
            deletedAt: null,
            isFeaturedAsset: true,
            status: {
              $in: [AssetStatus.LIVE, AssetStatus.GOING_LIVE, AssetStatus.SOLD],
            },
          },
        },
        {
          $addFields: {
            statusOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", AssetStatus.LIVE] }, then: 0 },
                  { case: { $eq: ["$status", AssetStatus.SOLD] }, then: 1 },
                  {
                    case: { $eq: ["$status", AssetStatus.GOING_LIVE] },
                    then: 2,
                  },
                ],
                default: 3,
              },
            },
          },
        },
        {
          $sort: {
            statusOrder: 1,
            listedDate: -1,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      let likedAssetIdSet: Set<string> | null = null;

      if (userId) {
        const likedAssets = await this.wishlistAssetModel.find(
          {
            assetId: { $in: featureAssets.map((asset) => asset._id) },
            userId: userId,
          },
          { assetId: 1 },
        );
        likedAssetIdSet = new Set(
          likedAssets.map((like) => like.assetId.toString()),
        );
      }
      const featureListWithLikes = featureAssets.map((asset) => ({
        ...asset,
        isLiked: userId
          ? (likedAssetIdSet.has(asset._id.toString()) ?? false)
          : false,
      }));

      return featureListWithLikes;
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async getExclusiveAccess(
    { _id: userId }: UserDocument,
    assetId: mongoose.Types.ObjectId,
  ) {
    try {
      const assetDetails = this.assetRepository.findOne({ isAdminAsset: true });
      if (!assetDetails) throw new Error(ERROR_MESSAGES.NOT_ADMIN_ASSET);

      return this.exclusiveAccessRepository.find({ userId, assetId });
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async assetsDraft(assetDraftData: AssetsDraftDto, userId: string) {
    try {
      const isDraftExist = await this.assetDraftModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (assetDraftData?.documents) {
        const docs = Object.entries(assetDraftData.documents).flatMap(
          ([key, documents]) =>
            documents.map(({ name, url }) => ({
              type: key,
              documentName: name,
              documentUrl: url,
            })),
        );

        assetDraftData.draftedDocuments = docs;
      }

      if (!isDraftExist) {
        return await this.assetDraftModel.create({
          ...assetDraftData,
          userId: new mongoose.Types.ObjectId(userId),
        });
      }

      return await this.assetDraftModel.updateOne(
        { _id: isDraftExist._id },
        { $set: assetDraftData },
      );
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async deleteAssetDraft(draftId: string) {
    await this.assetDraftModel.findByIdAndDelete(draftId);
    return "Draft deleted";
  }

  async assetListing(userId: string, listingDto: AssetListingDto) {
    try {
      const asset = await this.assetModel.findOne({
        _id: listingDto.assetId,
        sellerId: { $ne: new mongoose.Types.ObjectId(userId) },
      });
      if (!asset) {
        throw new RpcException(ERROR_MESSAGES.ASSET.ASSET_NOT_FOUND);
      }
      const assetListing = new this.assetListingModel({
        ...listingDto,
        createdTokens: listingDto.tokens,
        createdTokenPrice: listingDto.tokenPrice,
        sellerId: new mongoose.Types.ObjectId(userId),
      });
      return await assetListing.save();
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async getAssetDraft(userId: string) {
    try {
      const draft = await this.assetDraftModel
        .findOne({
          userId: new mongoose.Types.ObjectId(userId),
        })
        .lean();

      if (!draft) {
        return { data: [] };
      }

      let categoryName = null;
      if (draft?.category) {
        const category = await this.assetCategoryModel
          .findById(draft.category)
          .select("category")
          .lean();
        categoryName = category?.category || null;
      }

      const response = {
        ...draft,
        category_name: categoryName,
      };

      return {
        data: [response],
      };
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async fetchUserCollectionsCount(userId: string) {
    const [assetCollected, assetSold, assetListed] = await Promise.all([
      this.tokenModel
        .aggregate([
          {
            $match: {
              buyerId: new Types.ObjectId(userId),
              deletedAt: null,
            },
          },
          {
            $group: {
              _id: "$assetId",
            },
          },
          {
            $count: "count",
          },
        ])
        .then((result) => result[0]?.count || 0),
      this.assetListingModel.countDocuments({
        sellerId: new mongoose.Types.ObjectId(userId),
        deletedAt: { $ne: null },
      }),
      this.assetListingModel
        .aggregate([
          {
            $match: {
              sellerId: new Types.ObjectId(userId),
              deletedAt: null,
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
          {
            $unwind: {
              path: "$asset",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $count: "count",
          },
        ])
        .then((result) => result[0]?.count || 0),
    ]);

    return {
      AssetCollected: assetCollected,
      AssetSold: assetSold,
      AssetListed: assetListed,
    };
  }

  async fetchUserCollections(
    userId: string,
    type: string,
    filters: string,
    pagination: string,
  ) {
    pagination = JSON.parse(pagination);
    filters = JSON.parse(filters);
    const filterQuery = {};
    const sortBy = {};
    const skip = (pagination["currentPage"] - 1) * pagination["assetPerPage"];

    if (filters["searchValue"]) {
      filterQuery["name"] = {
        $regex: filters["searchValue"],
        $options: "i",
      };
    }

    if (filters["categories"] && filters["categories"]?.length > 0) {
      filterQuery["category"] = {
        $in: filters["categories"],
      };
    }

    if (filters["min"] && filters["max"] && filters["max"] > filters["min"]) {
      filterQuery["price"] = {
        ["$gte"]: filters["min"],
        ["$lte"]: filters["max"],
      };
    }

    switch (filters["sortBy"]) {
      case "price-low-to-high":
        sortBy["price"] = 1;
        break;
      case "price-high-to-low":
        sortBy["price"] = -1;
        break;
      case "recently-bought":
        sortBy["soldAt"] = -1;
        break;
      default:
        sortBy["createdAt"] = -1;
    }

    const customAggregateStages = [
      {
        $addFields: {
          categoryObjectId: { $toObjectId: "$category" },
        },
      },
      {
        $lookup: {
          from: "assetcategories",
          localField: "categoryObjectId",
          foreignField: "_id",
          as: "categoryDoc",
        },
      },
      {
        $unwind: {
          path: "$categoryDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          category: "$categoryDoc.category",
        },
      },
      {
        $project: {
          categoryDoc: 0,
          categoryObjectId: 0,
        },
      },
      {
        $match: filterQuery,
      },
      {
        $sort: sortBy,
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: pagination["assetPerPage"] }],
          total: [{ $count: "count" }],
        },
      },
      {
        $unwind: {
          path: "$total",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          data: 1,
          total: "$total.count",
        },
      },
    ];

    const customResponse = {
      assets: [],
      currentPage: pagination["currentPage"],
      totalAssets: 0,
      assetPerPage: pagination["assetPerPage"],
    };

    if (type === COLLECTION_TYPE.AssetCollected) {
      const [result] = await this.tokenModel.aggregate([
        {
          $match: {
            buyerId: new Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: "$assetId",
            tokensBought: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "assets",
            localField: "_id",
            foreignField: "_id",
            as: "asset",
          },
        },
        { $unwind: "$asset" },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$asset", { tokensBought: "$tokensBought" }],
            },
          },
        },
        {
          $addFields: {
            availableTokens: { $subtract: ["$tokens", "$tokensBought"] },
            totalValue: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$price", "$tokens"] },
                    "$tokensBought",
                  ],
                },
                2,
              ],
            },
          },
        },
        ...customAggregateStages,
      ]);
      customResponse.assets = result.data;
      customResponse.totalAssets = result.total;
    }
    if (type === COLLECTION_TYPE.AssetSold) {
      const [result] = await this.assetListingModel.aggregate([
        {
          $match: {
            sellerId: new mongoose.Types.ObjectId(userId),
            deletedAt: { $ne: null },
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
        {
          $unwind: {
            path: "$asset",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: ["$asset", "$$ROOT"] },
          },
        },
        {
          $addFields: {
            tokensBought: "$tokens",
            totalValue: "$tokenPrice",
          },
        },
        ...customAggregateStages,
      ]);

      customResponse.assets = result.data;
      customResponse.totalAssets = result.total;
    }
    if (type === COLLECTION_TYPE.AssetListed) {
      const [result] = await this.assetListingModel.aggregate([
        {
          $match: {
            sellerId: new mongoose.Types.ObjectId(userId),
            deletedAt: null,
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
        {
          $unwind: {
            path: "$asset",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: ["$asset", "$$ROOT"] },
          },
        },
        {
          $addFields: {
            tokensBought: "$tokens",
            totalValue: "$tokenPrice",
          },
        },
        ...customAggregateStages,
      ]);

      customResponse.assets = result.data;
      customResponse.totalAssets = result.total;
    }

    return customResponse;
  }

  async fetchAssetsSoldByUser(userId: string) {
    return this.assetModel.find({
      sellerId: userId,
      sold: true,
      status: AssetStatus.SOLD,
    });
  }

  async fetchUserAssetsForSale(userId: string) {
    return this.assetModel.find({
      sellerId: userId,
      status: "Live",
    });
  }

  async assetPartialSearch(searchValue: string) {
    try {
      return this.assetModel.find({
        name: { $regex: searchValue, $options: "i" },
      });
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }
}
