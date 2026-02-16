import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

import { ERROR_MESSAGES } from "src/shared-kernel/utils/constants/exceptions/error-message";
import { StripeService } from "src/stripe/stripe.service";
import {
  AccountStatusResponse,
  CreateStripeAccount,
  CreateStripeAccountResponse,
} from "src/users/interface/create-stripe-account.interface";
import { UserRepository } from "src/users/repositories/user.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly stripeServices: StripeService,
    private readonly userRepository: UserRepository,
  ) {}

  async createStripeAccount(
    stripeAccountDetails: CreateStripeAccount,
  ): Promise<CreateStripeAccountResponse> {
    try {
      const userDetails = await this.userRepository.find(
        stripeAccountDetails.email,
      );
      if (!userDetails)
        throw new Error(ERROR_MESSAGES.RESPONSES.USER_NOT_FOUND);
      if (userDetails.stripeAccountId)
        return {
          accountExist: true,
          stripeAccountId: userDetails.stripeAccountId,
        };
      const { id } =
        await this.stripeServices.createStripeAccount(stripeAccountDetails);
      const { url } = await this.stripeServices.createOnboardingOrUpdateUrl(id);
      await this.userRepository.updateStripeAccountId(
        stripeAccountDetails.email,
        id,
      );
      return { accountExist: false, url };
    } catch (error) {
      console.error("Stripe Create Error:", error);
      throw new RpcException(error.message);
    }
  }

  async getStripeAccountStatus(
    accountId: string,
  ): Promise<AccountStatusResponse> {
    try {
      const accountStatus =
        await this.stripeServices.getAccountStatus(accountId);
      return accountStatus;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async updateStripeAccount(accountId: string): Promise<string> {
    try {
      const {
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
      } = await this.stripeServices.getAccountDetails(accountId);
      const { url } = await this.stripeServices.createOnboardingOrUpdateUrl(
        accountId,
        { chargesEnabled, payoutsEnabled },
      );
      return url;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async createStripeLoginLink(accountId: string) {
    try {
      const isAccountOnboarded =
        await this.stripeServices.isAccountOnboarded(accountId);

      let linkResponse = {};

      if (isAccountOnboarded) {
        linkResponse =
          await this.stripeServices.createStripeLoginLink(accountId);
      } else {
        linkResponse =
          await this.stripeServices.createOnboardingOrUpdateUrl(accountId);
      }

      linkResponse = {
        ...linkResponse,
        isAccountOnboarded,
      };

      return linkResponse;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
