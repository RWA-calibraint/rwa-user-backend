import { Body, Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

import { MESSAGES_EVENTS } from "src/shared-kernel/utils/constants/message-events";
import {
  AccountStatusResponse,
  CreateStripeAccount,
  CreateStripeAccountResponse,
} from "src/users/interface/create-stripe-account.interface";
import { UsersService } from "src/users/users.service";

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(MESSAGES_EVENTS.CREATE_STRIPE_ACCOUNT)
  async createConnected(
    @Body() stripeAccountDetails: CreateStripeAccount,
  ): Promise<CreateStripeAccountResponse> {
    return this.usersService.createStripeAccount(stripeAccountDetails);
  }

  @MessagePattern(MESSAGES_EVENTS.STRIPE_ACCOUNT_STATUS)
  async stripeAccountStatus(
    @Body() accountId: string,
  ): Promise<AccountStatusResponse> {
    return this.usersService.getStripeAccountStatus(accountId);
  }

  @MessagePattern(MESSAGES_EVENTS.UPDATE_STRIPE_ACCOUNT)
  async updateStripeAccount(@Body() accountId: string): Promise<string> {
    return this.usersService.updateStripeAccount(accountId);
  }

  @MessagePattern(MESSAGES_EVENTS.CREATE_STRIPE_LOGIN_LINK)
  async createStripeLoginLink(@Body() accountId: string) {
    return this.usersService.createStripeLoginLink(accountId);
  }
}
