import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import mongoose, { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Rewards {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: "Asset",
  })
  assetId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: "User",
  })
  buyerId?: mongoose.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  rewardPoints?: number;
}

export type RewardDocument = HydratedDocument<Rewards>;

export const RewardsSchema = SchemaFactory.createForClass(Rewards);
