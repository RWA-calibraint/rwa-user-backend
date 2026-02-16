import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document } from "mongoose";

import { AssetStatus } from "src/shared-kernel/utils/constants/asset-context";

export type AssetHistoryDocument = AssetHistory & Document;

@Schema({ timestamps: true })
export class AssetHistory {
  @Prop({ required: true })
  assetId: string;

  @Prop({ default: AssetStatus.NEWLY_ADDED })
  status: AssetStatus;

  @Prop({ default: null })
  verificationDate: Date;

  @Prop({ default: null })
  remarks: string;

  @Prop()
  deletedAt?: Date;
}

export const AssetHistorySchema = SchemaFactory.createForClass(AssetHistory);
