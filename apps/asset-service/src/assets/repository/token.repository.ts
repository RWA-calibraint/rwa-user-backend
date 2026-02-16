import { InjectModel } from "@nestjs/mongoose";

import { Model, RootFilterQuery, Types, UpdateQuery } from "mongoose";

import { Token, TokenDocument } from "src/assets/schemas/token.schema";

export class TokenRepository {
  constructor(
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,
  ) {}

  async findAll(
    query: RootFilterQuery<TokenDocument>,
    limit?: number,
  ): Promise<Token[] | []> {
    const queryBuilder = this.tokenModel.find(query);
    if (limit) queryBuilder.limit(limit);
    return queryBuilder;
  }

  async update(
    filter: RootFilterQuery<TokenDocument>,
    updateQuery: UpdateQuery<TokenDocument>,
  ) {
    return this.tokenModel.updateMany(filter, updateQuery);
  }

  async getTotalCount(query: RootFilterQuery<TokenDocument>) {
    return this.tokenModel.countDocuments(query);
  }

  async findUserAssets(userId: string): Promise<any[]> {
    return this.tokenModel
      .find({ buyerId: new Types.ObjectId(userId) })
      .populate("assetId")
      .select("assetId -_id");
  }
}
