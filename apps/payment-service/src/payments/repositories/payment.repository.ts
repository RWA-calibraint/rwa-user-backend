import { InjectModel } from "@nestjs/mongoose";

import {
  Model,
  PipelineStage,
  PopulateOptions,
  RootFilterQuery,
} from "mongoose";

import { Payment, PaymentDocument } from "src/payments/schemas/payment.schema";

export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(paymentDetails: Payment): Promise<PaymentDocument> {
    return new this.paymentModel(paymentDetails).save();
  }

  async findByCheckoutSessionIdAndUpdate(
    checkoutSessionId: string,
    paymentDetails: Partial<Payment>,
  ): Promise<Payment | null> {
    return this.paymentModel.findOneAndUpdate(
      { checkoutSessionId },
      paymentDetails,
      { new: true },
    );
  }

  async findOne(checkoutSessionId: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ checkoutSessionId });
  }

  async findAll(
    queryDetails: RootFilterQuery<PaymentDocument>,
    populate?: PopulateOptions | (PopulateOptions | string)[] | undefined,
  ) {
    return this.paymentModel.find(queryDetails).populate(populate);
  }

  async findWithAggregate(pipeline: PipelineStage[]) {
    return this.paymentModel.aggregate(pipeline);
  }
}
