import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { firstValueFrom } from "rxjs";

import { CreatePaymentDto, GetOrdersDto } from "src/payments/dto";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";
import {
  constructErrorResponse,
  constructFailureResponse,
  constructSuccessResponse,
} from "src/utils/helper";

@ApiBearerAuth()
@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    @Inject(MICRO_SERVICES.PAYMENT_SERVICE.NAME)
    private readonly paymentClient: ClientProxy,
  ) {}

  @Post("buy")
  @ApiOperation({ summary: "Purchase an asset" })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Purchase successful",
    schema: {
      example: {
        response_code: 200,
        response_status: "success",
        response: { url: "abc123", status: "completed" },
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
        response_error: "Invalid buyerId",
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
  async buyTheAsset(@Body() paymentData: CreatePaymentDto, @Req() request) {
    try {
      const result = await firstValueFrom(
        this.paymentClient.send(
          MICRO_SERVICES.PAYMENT_SERVICE.MESSAGES_EVENTS.BUY,
          { paymentDetails: paymentData, userDetails: request?.user?.result },
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

  @Get("orders")
  @ApiOperation({ summary: "Get Payment Orders Api" })
  async getAllOrders(@Req() request, @Query() queryDetails: GetOrdersDto) {
    try {
      const result = await firstValueFrom(
        this.paymentClient.send(
          MICRO_SERVICES.PAYMENT_SERVICE.MESSAGES_EVENTS.ORDERS,
          { userId: request?.user?.result?._id, ...queryDetails },
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

  @ApiBearerAuth()
  @Get("user/rewards/list")
  @ApiOperation({ summary: "Get User Rewards Api" })
  async userAssetRewards(@Req() request) {
    try {
      const userId = request?.user?.result?._id;
      const result = await firstValueFrom(
        this.paymentClient.send(
          MICRO_SERVICES.PAYMENT_SERVICE.MESSAGES_EVENTS.REWARDS_LIST,
          {
            userId,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
