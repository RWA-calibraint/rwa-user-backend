import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";

import Stripe from "stripe";

import { StripeService } from "../stripe.service";

@Controller("payment/stripe")
export class StripeWebhook {
  constructor(private readonly stripeServices: StripeService) {}

  @Post("webhooks")
  @HttpCode(HttpStatus.OK)
  async handleStripeWebHooks(@Req() request: RawBodyRequest<Request>) {
    return this.stripeServices.handleStripeWebhook({
      requestPayload: request.body as unknown as Stripe.Event,
    });
  }
}
