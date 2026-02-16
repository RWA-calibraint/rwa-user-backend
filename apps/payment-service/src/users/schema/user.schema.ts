// TODO: Need to remove the future
// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

// import { HydratedDocument } from "mongoose";

// @Schema({ timestamps: true })
// export class User {
//   @Prop({ required: true, type: String, unique: true })
//   email: string;
//   @Prop({ required: true, type: String })
//   password: string;
//   @Prop({ required: true, type: String, unique: true })
//   cognitoSubId: string;
//   @Prop({ type: String })
//   stripeAccountId?: string;
// }

// export type UserDocument = HydratedDocument<User>;

// export const UserSchema = SchemaFactory.createForClass(User);

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
  name: string;
  @Prop({ enum: USER_STATUS, type: String, default: USER_STATUS.ACTIVE })
  status?: USER_STATUS;
  @Prop({ type: Date })
  suspendExpiryAt?: Date;
  @Prop({ type: String })
  stripeAccountId?: string;
  @Prop({ type: Number, default: 0 })
  rewardPoints?: number;
  @Prop({ required: true, type: String })
  firstName: string;
  @Prop({ required: true, type: String })
  lastName: string;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
