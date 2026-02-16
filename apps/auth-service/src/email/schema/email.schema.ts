import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true, type: String, unique: true })
  email: string;
}

export type EmailDocument = HydratedDocument<Email>;

export const EmailSchema = SchemaFactory.createForClass(Email);
