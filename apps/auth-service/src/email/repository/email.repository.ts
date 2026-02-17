/* eslint-disable @typescript-eslint/no-explicit-any */
import { InjectModel } from "@nestjs/mongoose";

import { Model, UpdateWriteOpResult } from "mongoose";

import { Email, EmailDocument } from "src/email/schema/email.schema";

export class EmailRepository {
  constructor(
    @InjectModel(Email.name)
    private readonly emailModel: Model<EmailDocument>,
  ) {}
  async create(email: string): Promise<Email> {
    return new this.emailModel({ email }).save();
  }
  async findOne(email: string): Promise<Email> {
    return this.emailModel.findOne({ email });
  }
  async update(userDetails: Email): Promise<UpdateWriteOpResult> {
    return this.emailModel.updateOne(
      { email: userDetails.email },
      userDetails,
    ) as any;
  }
}
