import { Body, Controller } from "@nestjs/common";
import { MessagePattern, RpcException } from "@nestjs/microservices";

import { MESSAGES_EVENTS } from "src/shared-kernel/constants/message_events";

import { AssetsService } from "./assets.service";
import { AssetListingDto } from "./dto/asset-listing.dto";
import { AssetStatusDto } from "./dto/asset-status.dto";
import { AssetsDraftDto } from "./dto/assets-draft.dto";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { SubmitExclusiveAccessInterface } from "./interface/assets.interface";
import { GetSoldAssetByUser } from "./interface/sold-asset.interface";

@Controller()
export class AssetsController {
  constructor(private readonly assetService: AssetsService) {}

  @MessagePattern(MESSAGES_EVENTS.CREATE_ASSET)
  async create(data: {
    dto: CreateAssetDto;
    coverImageUrl;
    imageUrls;
    userId: string;
  }) {
    try {
      return this.assetService.create(
        data.dto,
        data.coverImageUrl,
        data.imageUrls,
        data.userId,
      );
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.CREATE_DOCUMENT)
  async createDocument(data: { documentDetails }) {
    try {
      return this.assetService.createDocument(data.documentDetails);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.LIVE_ASSETS)
  async findLiveAssets(data: { userDetails: any }) {
    try {
      return this.assetService.fetchLiveAssets(data.userDetails?._id);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.BUY_ASSET)
  async convertToLive(data: { assetId: string }) {
    try {
      return this.assetService.convertToLive(data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.FIND_ASSET)
  async findOne(data: { assetId: string; userId: string }) {
    try {
      return this.assetService.findOne(data.assetId, data.userId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.UPDATE_ASSET)
  async update(data: {
    assetId: string;
    dto: CreateAssetDto;
    coverImageUrl;
    imageUrls;
  }) {
    try {
      return this.assetService.update(
        data.assetId,
        data.dto,
        data.coverImageUrl,
        data.imageUrls,
      );
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.REMOVE_ASSET)
  async remove(data: { assetId: string }) {
    try {
      return this.assetService.remove(data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.FIND_ASSET_TAG)
  async findAssetTag(data: { tagId: string }) {
    try {
      return this.assetService.findAssetTag(data.tagId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.QR_CODE_SCAN)
  async qrCodeScan(data: { assetId: string; qrCode: string }) {
    try {
      return this.assetService.qrCodeScan(data.assetId, data.qrCode);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.GET_USER_ASSET)
  async findAssetByUser(data: { userId: string }) {
    try {
      return this.assetService.findAssetByUser(data.userId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.CATEGORY_LIST)
  async getCategoryList() {
    try {
      return this.assetService.getAllCategories();
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.DELETE_LISTINGS)
  async deleteListings(data: { id: string }) {
    try {
      return this.assetService.deleteListings(data.id);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.IMAGES_BY_CATEGORY)
  async fetchImagesByAsset(data: { categoryId: string }) {
    try {
      return this.assetService.fetchImagesByAsset(data.categoryId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.PRICE_HISTORY)
  async fetchPriceHistory(data: { assetId: string }) {
    try {
      return this.assetService.fetchPriceHistory(data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_WISHLIST_ASSET)
  async fetchWishlistAsset(data: {
    userId: string;
    filters: string;
    pagination: string;
  }) {
    try {
      return this.assetService.fetchWishlistAsset(
        data?.userId,
        data?.filters,
        data?.pagination,
      );
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_WISHLIST_ASSET_COUNT)
  async fetchWishlistAssetCount(data: { assetId: string }) {
    try {
      return await this.assetService.fetchWishlistAssetCount(data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode || 500,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.ASSET_VIEWS)
  async assetViews(data: { userId: string; assetId: string }) {
    try {
      return await this.assetService.assetViews(data.userId, data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode || 500,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_ASSET_VIEWS_COUNT)
  async fetchAssetViewCount(data: { assetId: string }) {
    try {
      return await this.assetService.fecthAssetViewCount(data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode || 500,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_ASSET_BY_STATUS)
  async fetchAssetListbyStatus(data: {
    userDetails: any;
    status: AssetStatusDto;
  }) {
    try {
      return this.assetService.fetchAssetListbyStatus(
        data?.userDetails?.result?._id,
        data?.status,
      );
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.WISHLIST_ASSET)
  async wishlistAsset(data: { userId: string; assetId: string }) {
    try {
      return this.assetService.wishlistAsset(data.userId, data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.SUBMISSION_COUNT)
  async getSubmissionsCount(data: { userDetails: any }) {
    try {
      return this.assetService.getSubmissionCount(
        data.userDetails?.result?._id,
      );
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.SOLD_ASSET)
  async getSoldAssets(soldAssetQuery: GetSoldAssetByUser) {
    return this.assetService.getSoldAssets(soldAssetQuery);
  }

  @MessagePattern(MESSAGES_EVENTS.SUBMIT_EXCLUSIVE_ACCESS)
  async submitExclusiveAccess(
    @Body() { userDetails, assetId }: SubmitExclusiveAccessInterface,
  ) {
    return this.assetService.submitExclusiveAccess(userDetails.result, assetId);
  }

  @MessagePattern(MESSAGES_EVENTS.GET_FEATURE_ASSET)
  async getFeatureAsset(data: { userDetails: any }) {
    return this.assetService.getFeatureAsset(data.userDetails?._id);
  }

  @MessagePattern(MESSAGES_EVENTS.GET_EXCLUSIVE_ACCESS)
  async getExclusiveAccess(
    @Body() { userDetails, assetId }: SubmitExclusiveAccessInterface,
  ) {
    return this.assetService.getExclusiveAccess(userDetails.result, assetId);
  }

  @MessagePattern(MESSAGES_EVENTS.ASSETS_DRAFT)
  async assetsDraft(data: {
    assetDraftData: AssetsDraftDto;
    userDetails: any;
  }) {
    return this.assetService.assetsDraft(
      data.assetDraftData,
      data.userDetails.result._id,
    );
  }

  @MessagePattern(MESSAGES_EVENTS.ASSET_LISTING)
  async listingAsset(data: { userId: string; listingDto: AssetListingDto }) {
    return this.assetService.assetListing(data.userId, data.listingDto);
  }

  @MessagePattern(MESSAGES_EVENTS.GET_ASSET_DRAFT)
  async getAssetDraft(data: { userDetails: any }) {
    return this.assetService.getAssetDraft(data.userDetails?.result?._id);
  }

  @MessagePattern(MESSAGES_EVENTS.DELETE_ASSET_DRAFT)
  async deleteAssetDraft(data: { draftId: string }) {
    return this.assetService.deleteAssetDraft(data.draftId);
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_USER_COLLECTIONS_COUNT)
  async fetchUserCollectionsCount(data: { userId: string }) {
    return this.assetService.fetchUserCollectionsCount(data?.userId);
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_USER_COLLECTIONS)
  async fetchUserCollections(data: {
    userId: string;
    type: string;
    filters: string;
    pagination: string;
  }) {
    return this.assetService.fetchUserCollections(
      data?.userId,
      data?.type,
      data?.filters,
      data?.pagination,
    );
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_ASSETS_SOLD_BY_USER)
  async fetchAssetsSoldByUser(data: { userId: string }) {
    return this.assetService.fetchAssetsSoldByUser(data?.userId);
  }

  @MessagePattern(MESSAGES_EVENTS.FETCH_USER_ASSETS_FOR_SALE)
  async fetchUserAssetsForSale(data: { userId: string }) {
    return this.assetService.fetchUserAssetsForSale(data?.userId);
  }

  @MessagePattern(MESSAGES_EVENTS.ASSET_PARTIAL_SEARCH)
  async assetPartialSearch(@Body() { searchValue }) {
    return this.assetService.assetPartialSearch(searchValue);
  }
}
