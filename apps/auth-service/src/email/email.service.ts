import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

import { EmailRepository } from "src/email/repository/email.repository";
import { EMAILS } from "src/shared-kernel/utils/constants/email/join-community";
import { ERROR_MESSAGES } from "src/shared-kernel/utils/constants/exceptions/error-message";
import { SendGridServices } from "src/shared-kernel/utils/services/send-grid/send-grid.service";

@Injectable()
export class EmailService {
  constructor(
    private readonly sendGridServices: SendGridServices,
    private readonly emailRepository: EmailRepository,
  ) {}

  async joinCommunity(email: string): Promise<string> {
    try {
      const isEmailExist = await this.emailRepository.findOne(email);
      if (isEmailExist) throw new Error(ERROR_MESSAGES.EMAIL.ALREADY_JOINED);

      const mailParams = this.sendGridServices.prepareMailTemplate(
        EMAILS.JOIN_COMMUNITY.BODY,
        email,
        EMAILS.JOIN_COMMUNITY.SUBJECT,
      );
      await this.sendGridServices.send(mailParams);
      await this.emailRepository.create(email);
      return "OK";
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
