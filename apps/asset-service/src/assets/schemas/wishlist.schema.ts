import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import mongoose, { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class WishlistAsset {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" })
  userId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: "Asset" })
  assetId: string;
}

export type WishListDocument = HydratedDocument<WishlistAsset>;

export const WishlistAssetSchema = SchemaFactory.createForClass(WishlistAsset);
