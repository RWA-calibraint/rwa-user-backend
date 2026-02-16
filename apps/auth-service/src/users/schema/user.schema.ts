import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { HydratedDocument } from "mongoose";

import { USER_STATUS } from "src/shared-kernel/utils/constants/user-enums";

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, unique: true })
  userId: string;

  @Prop({ required: true, type: String, unique: true })
  email: string;

  @Prop({ type: String })
  walletAddress?: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ required: true, type: String, unique: true })
  cognitoSubId: string;

  @Prop({ required: true, type: String })
  firstName: string;

  @Prop({ required: true, type: String })
  lastName: string;

  @Prop({ enum: USER_STATUS, type: String, default: USER_STATUS.ACTIVE })
  status?: USER_STATUS;

  @Prop({ type: Date, default: null })
  suspendExpiryAt?: Date | null;

  @Prop({ type: String })
  stripeAccountId?: string;

  @Prop({ type: String, default: null })
  phoneNumber?: string;

  @Prop({ type: String, default: null })
  address?: string;

  @Prop({ type: String, default: null })
  country?: string;

  @Prop({ type: String, default: null })
  state?: string;

  @Prop({ type: String, default: null })
  city?: string;

  @Prop({ type: String, default: null })
  building?: string;

  @Prop({ type: String, default: null })
  postalCode?: string;

  @Prop({ type: Number, default: 0 })
  rewardPoints?: number;

  @Prop({ type: Date, default: null })
  lastActive?: Date | null;

  @Prop({ type: String, default: null })
  profilePic?: string;

  @Prop({ type: Date, default: null })
  dateOfBirth?: Date;

  @Prop({ type: String, default: null })
  applicantId?: string;

  @Prop({ type: String, default: null })
  kytServiceRequest?: string;

  @Prop({ type: String, default: "pending" })
  kycVerificationStatus?: string;

  @Prop({ type: String, default: null })
  kycVerificationDetails?: string;

  @Prop({ type: Boolean, default: false })
  isVerified?: boolean;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
