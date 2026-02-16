import { InjectModel } from "@nestjs/mongoose";

import { Model, RootFilterQuery } from "mongoose";

import {
  AssetListing,
  AssetListingDocument,
} from "../schemas/asset-listing.schema";

export class AssetListingRepository {
  constructor(
    @InjectModel(AssetListing.name)
    private readonly listingModel: Model<AssetListingDocument>,
  ) {}

  async findAll(
    query: RootFilterQuery<AssetListingDocument>,
    limit?: number,
  ): Promise<AssetListing[] | []> {
    const queryBuilder = this.listingModel.find(query);
    if (limit) queryBuilder.limit(limit);
    return queryBuilder;
  }

  async findAndUpdateById(
    id: string,
    assetDetails: Partial<AssetListing>,
  ): Promise<AssetListing | null> {
    return this.listingModel.findOneAndUpdate({ _id: id }, assetDetails, {
      new: true,
    });
  }

  async findById(id: string): Promise<AssetListingDocument | null> {
    return this.listingModel.findById(id);
  }
}
