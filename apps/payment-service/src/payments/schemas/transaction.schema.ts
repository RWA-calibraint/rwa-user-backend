// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

// import mongoose, { HydratedDocument } from "mongoose";

// import {
//   ESCROW_TRANSACTION_STATUS,
//   PAYMENT_METHOD,
//   USER_TRANSACTION_STATUS,
// } from "src/shared-kernel/utils/constants/transactions";

// @Schema({ timestamps: true })
// export class Transaction {
//   @Prop({
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Payment",
//     default: null,
//   })
//   paymentId: mongoose.Schema.Types.ObjectId;

//   @Prop({ required: true, type: String, unique: true })
//   transactionId: string;

//   @Prop({
//     required: true,
//     type: USER_TRANSACTION_STATUS,
//     default: USER_TRANSACTION_STATUS.PENDING,
//   })
//   userPaymentStatus: typeof USER_TRANSACTION_STATUS;

//   @Prop({
//     required: true,
//     type: ESCROW_TRANSACTION_STATUS,
//     default: ESCROW_TRANSACTION_STATUS.PENDING,
//   })
//   escrowPaymentStatus: typeof ESCROW_TRANSACTION_STATUS;

//   @Prop({ required: true, type: PAYMENT_METHOD, default: null })
//   paymentMethod: PAYMENT_METHOD;

//   @Prop({ type: String })
//   refundReason?: string;
// }

// export type TransactionDocument = HydratedDocument<Transaction>;

// export const TransactionSchema = SchemaFactory.createForClass(Transaction);
