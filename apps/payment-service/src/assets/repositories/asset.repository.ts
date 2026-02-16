import { InjectModel } from "@nestjs/mongoose";

import { Model, RootFilterQuery } from "mongoose";

import { Asset, AssetDocument } from "src/assets/schemas/asset.schema";

export class AssetRepository {
  constructor(
    @InjectModel(Asset.name) private readonly assetModel: Model<AssetDocument>,
  ) {}

  async findAndUpdateById(
    id: string,
    assetDetails: Partial<Asset>,
  ): Promise<Asset | null> {
    return this.assetModel.findOneAndUpdate({ _id: id }, assetDetails, {
      new: true,
    });
  }

  async findById(id: string): Promise<AssetDocument | null> {
    return this.assetModel.findById(id);
  }

  async findOne(
    query: RootFilterQuery<AssetDocument>,
  ): Promise<AssetDocument | null> {
    return this.assetModel.findOne(query);
  }
}
