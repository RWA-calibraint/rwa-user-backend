import { Body, Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

import { CreatePayment } from "src/payments/interface";
import { PaymentsService } from "src/payments/payments.service";
import { MESSAGES_EVENTS } from "src/shared-kernel/utils/constants/message-events";
import { UserDocument } from "src/users/schema/user.schema";

import { GetOrdersParams } from "./interface/get-orders.interace";

@Controller()
export class PaymentsController {
  constructor(private readonly paymentServices: PaymentsService) {}

  @MessagePattern(MESSAGES_EVENTS.BUY)
  async buyTheAsset(
    @Body()
    {
      paymentDetails,
      userDetails,
    }: {
      paymentDetails: CreatePayment;
      userDetails: UserDocument;
    },
  ): Promise<string> {
    return this.paymentServices.buyTheAsset(paymentDetails, userDetails);
  }

  @MessagePattern(MESSAGES_EVENTS.ORDERS)
  async getAssetOrders(@Body() getOrdersParams: GetOrdersParams) {
    return this.paymentServices.getAssetOrders(getOrdersParams);
  }

  @MessagePattern(MESSAGES_EVENTS.REWARDS_LIST)
  async userRewardsList(data: { userId: string }) {
    return this.paymentServices.userRewardsList(data.userId);
  }
}
