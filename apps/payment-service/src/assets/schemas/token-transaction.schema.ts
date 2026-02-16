import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import mongoose, { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class TokenTransaction {
  @Prop({
    required: true,
  })
  tokenId: string;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "User",
  })
  fromBuyerId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "User",
  })
  toBuyerId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "Payment",
  })
  transactionId?: mongoose.Types.ObjectId;

  @Prop({
    required: true,
  })
  pricePerToken: number;
}

export type TokenTransactionDocument = HydratedDocument<TokenTransaction>;

export const TokenTransactionSchema =
  SchemaFactory.createForClass(TokenTransaction);
