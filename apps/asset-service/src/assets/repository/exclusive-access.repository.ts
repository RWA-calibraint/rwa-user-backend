import { InjectModel } from "@nestjs/mongoose";

import mongoose, { Model, RootFilterQuery } from "mongoose";

import {
  ExclusiveAccess,
  ExclusiveAccessDocument,
} from "../schemas/exclusive-access.schema";

export class ExclusiveAccessRepository {
  constructor(
    @InjectModel(ExclusiveAccess.name)
    private readonly exclusiveAccessModel: Model<ExclusiveAccessDocument>,
  ) {}

  async create(
    userId: mongoose.Types.ObjectId,
    assetId: mongoose.Types.ObjectId,
  ): Promise<ExclusiveAccess> {
    const exclusiveAccess = new this.exclusiveAccessModel({ userId, assetId });
    return exclusiveAccess.save();
  }

  async find(
    query: RootFilterQuery<ExclusiveAccessDocument>,
  ): Promise<ExclusiveAccess | null> {
    return this.exclusiveAccessModel.findOne(query);
  }

  async count(
    query: RootFilterQuery<ExclusiveAccessDocument>,
  ): Promise<number | null> {
    return this.exclusiveAccessModel.countDocuments(query);
  }
}
