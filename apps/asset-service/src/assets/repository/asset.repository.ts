import { InjectModel } from "@nestjs/mongoose";

import {
  Model,
  PipelineStage,
  PopulateOptions,
  RootFilterQuery,
} from "mongoose";

import { Asset, AssetDocument } from "src/assets/schemas/asset.schema";

export class AssetRepository {
  constructor(
    @InjectModel(Asset.name) private readonly assetModel: Model<AssetDocument>,
  ) {}

  async findAll(
    assetFilter: RootFilterQuery<AssetDocument>,
    populateQuery?: PopulateOptions | (PopulateOptions | string)[] | undefined,
    sortQuery?: Record<string, 1 | -1> | undefined,
  ): Promise<Asset[]> {
    return this.assetModel
      .find(assetFilter)
      .populate(populateQuery)
      .sort(sortQuery ?? {});
  }

  async findOne(
    assetFilter: RootFilterQuery<AssetDocument>,
    populateQuery?: PopulateOptions | (PopulateOptions | string)[] | undefined,
  ): Promise<Asset | null> {
    return this.assetModel.findOne(assetFilter).populate(populateQuery);
  }

  async findWithAggregate(pipeline: PipelineStage[]) {
    return this.assetModel.aggregate(pipeline);
  }
}
