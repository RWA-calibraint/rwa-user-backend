import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import mongoose, { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class TokenHistory {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: "Token",
  })
  tokenId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "User",
  })
  buyerId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "Payment",
  })
  transactionId?: mongoose.Types.ObjectId;
}

export type TokenHistoryDocument = HydratedDocument<TokenHistory>;

export const TokenHistorySchema = SchemaFactory.createForClass(TokenHistory);
