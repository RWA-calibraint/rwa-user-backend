import { InjectModel } from "@nestjs/mongoose";

import { Model, RootFilterQuery, UpdateQuery } from "mongoose";

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

  async findOne(query: RootFilterQuery<TokenDocument>): Promise<Token> {
    const queryBuilder = this.tokenModel.findOne(query);
    return queryBuilder;
  }

  async updateOne(
    filter: RootFilterQuery<TokenDocument>,
    updateQuery: UpdateQuery<TokenDocument>,
  ) {
    return this.tokenModel.updateOne(filter, updateQuery);
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

  async createMany(tokenDetails: Array<Token>) {
    this.tokenModel.insertMany(tokenDetails, { rawResult: true });
  }
}
