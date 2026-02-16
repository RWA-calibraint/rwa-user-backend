import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import mongoose, { Document } from "mongoose";

@Schema({ timestamps: true })
export class KytVerification extends Document {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "User",
  })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  serviceRequestId: string;

  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  requestStatus: string;

  @Prop({ required: true })
  serviceRequestType: string;

  @Prop({ type: Object, default: null })
  result: any;

  @Prop({ required: true })
  asset: string;

  @Prop()
  riskLevel: string;

  @Prop()
  network: string;

  @Prop()
  pdfReport: string;

  @Prop()
  uid: string;

  @Prop()
  memo: string;

  @Prop()
  fiatCodeEffective: string;

  @Prop({ default: false })
  blackListsConnections: boolean;

  @Prop({ default: false })
  hasBlackListFlag: boolean;
}

export const KytVerificationSchema =
  SchemaFactory.createForClass(KytVerification);
