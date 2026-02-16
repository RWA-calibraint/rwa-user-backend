import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { firstValueFrom } from "rxjs";

import { StripeAccountDto, StripeAccountIdValidation } from "src/payments/dto";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";
import {
  constructFailureResponse,
  constructSuccessResponse,
} from "src/utils/helper";

@ApiBearerAuth()
@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    @Inject(MICRO_SERVICES.PAYMENT_SERVICE.NAME)
    private readonly authClient: ClientProxy,
  ) {}

  @Post("create-stripe-account")
  @ApiOperation({ summary: "Create a connected Stripe account" })
  @ApiBody({ type: StripeAccountDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stripe account already exists",
    schema: {
      example: {
        response_code: 200,
        response_status: "success",
        response: { accountId: "acct_123456789", accountExists: true },
        response_error: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "Stripe account created successfully and provided the onboarding url in response",
    schema: {
      example: {
        response_code: 200,
        response_status: "success",
        response: { url: "onboarding_url", accountExists: false },
        response_error: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
    schema: {
      example: {
        response_code: 400,
        response_status: "failure",
        response: null,
        response_error: "Invalid email format",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal Server Error",
    schema: {
      example: {
        response_code: 500,
        response_status: "failure",
        response: null,
        response_error: "Internal Server Error",
      },
    },
  })
  async createConnected(@Body() stripeAccountDetails: StripeAccountDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send(
          MICRO_SERVICES.PAYMENT_SERVICE.MESSAGES_EVENTS.CREATE_STRIPE_ACCOUNT,
          stripeAccountDetails,
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      throw new HttpException(
        constructFailureResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error?.message || "Internal Server Error",
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("stripe/account-status/:accountId")
  @ApiOperation({ summary: "Get Stripe account status" })
  @ApiParam({
    name: "accountId",
    description: "The Stripe account ID to check status for",
    example: "acct_123456789",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stripe account status retrieved successfully",
    schema: {
      example: {
        accountId: "acct_1QrlN3POaVSQOUQk",
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        requirements: {
          currentlyDue: [],
          eventuallyDue: [
            "individual.dob.day",
            "individual.dob.month",
            "individual.dob.year",
            "individual.ssn_last_4",
          ],
          pastDue: [],
          pendingVerification: [],
        },
        capabilities: {
          transfers: "active",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid Stripe account ID",
    schema: {
      example: {
        response_code: 400,
        response_status: "failure",
        response: null,
        response_error: "Invalid Stripe account ID",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal Server Error",
    schema: {
      example: {
        response_code: 500,
        response_status: "failure",
        response: null,
        response_error: "Internal Server Error",
      },
    },
  })
  async accountStatus(@Param() { accountId }: StripeAccountIdValidation) {
    try {
      const result = await firstValueFrom(
        this.authClient.send(
          MICRO_SERVICES.PAYMENT_SERVICE.MESSAGES_EVENTS.STRIPE_ACCOUNT_STATUS,
          accountId,
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      throw new HttpException(
        constructFailureResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error?.message || "Internal Server Error",
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("stripe/update-account/:accountId")
  @ApiOperation({ summary: "Update a Stripe account" })
  @ApiParam({
    name: "accountId",
    description: "The Stripe account ID to update",
    example: "acct_123456789",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Stripe account update url returned in response",
    schema: {
      example: {
        response_code: 200,
        response_status: "success",
        response: "account_update_url",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid Stripe account ID",
    schema: {
      example: {
        response_code: 400,
        response_status: "failure",
        response: null,
        response_error: "Invalid Stripe account ID",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Internal Server Error",
    schema: {
      example: {
        response_code: 500,
        response_status: "failure",
        response: null,
        response_error: "Internal Server Error",
      },
    },
  })
  async updateStripeAccount(@Param() { accountId }: StripeAccountIdValidation) {
    try {
      const result = await firstValueFrom(
        this.authClient.send(
          MICRO_SERVICES.PAYMENT_SERVICE.MESSAGES_EVENTS.UPDATE_STRIPE_ACCOUNT,
          accountId,
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      throw new HttpException(
        constructFailureResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error?.message || "Internal Server Error",
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("stripe/login/:accountId")
  @ApiOperation({ summary: "Create User Stripe Login Link Api" })
  @ApiParam({ name: "accountId", type: String })
  async createStripeLoginLink(@Param() { accountId }) {
    try {
      const result = await firstValueFrom(
        this.authClient.send(
          MICRO_SERVICES.PAYMENT_SERVICE.MESSAGES_EVENTS
            .CREATE_STRIPE_LOGIN_LINK,
          accountId,
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      throw new HttpException(
        constructFailureResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error?.message || "Internal Server Error",
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
