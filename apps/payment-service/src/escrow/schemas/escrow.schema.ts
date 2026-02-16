import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document } from "mongoose";

// TODO: Need to refactor this code while working in this service

export enum EscrowStatus {
  PENDING = "pending",

  RELEASED = "released",

  CANCELLED = "cancelled",

  REFUNDED = "refunded",

  DISPUTED = "disputed",
}

@Schema({ timestamps: true })
export class Escrow extends Document {
  @Prop({ required: true })
  paymentIntentId: string;

  @Prop({ required: true })
  sellerId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true, enum: EscrowStatus, default: EscrowStatus.PENDING })
  status: EscrowStatus;

  @Prop({ type: [String], default: [] })
  requiredDocuments: string[];

  @Prop({ type: [String], default: [] })
  submittedDocuments: string[];

  @Prop()
  disputeId?: string;

  @Prop()
  disputeReason?: string;

  @Prop()
  disputeResolvedAt?: Date;

  @Prop()
  releasedAt?: Date;

  @Prop()
  releasedBy?: string;

  @Prop()
  refundId?: string;

  @Prop()
  refundReason?: string;

  @Prop()
  cancelReason?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  refundedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type EscrowDocument = Escrow & Document;
export const EscrowSchema = SchemaFactory.createForClass(Escrow);
