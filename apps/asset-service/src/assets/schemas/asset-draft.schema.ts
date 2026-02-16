import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import mongoose, { Document } from "mongoose";

export type AssetDraftDocument = AssetDraft & Document;

@Schema({ timestamps: true })
export class AssetDraft {
  @Prop()
  userId: mongoose.Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "AssetCategory",
  })
  category: mongoose.Types.ObjectId;

  @Prop()
  images: string[];

  @Prop()
  address: string;

  @Prop()
  country: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  pincode: string;

  @Prop()
  draftedDocuments: object[];

  @Prop({ default: Date.now, expires: "5d" })
  createdAt: Date;
}

export const AssetDraftSchema = SchemaFactory.createForClass(AssetDraft);
