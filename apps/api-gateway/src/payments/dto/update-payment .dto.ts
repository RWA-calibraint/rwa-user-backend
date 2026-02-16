import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty } from "class-validator";

import { ERROR_MESSAGES } from "src/shared-kernel/constants/exceptions/error-message";
import { PaymentStatus } from "src/shared-kernel/constants/payment-status";

export class UpdatePaymentDto {
  @ApiProperty({
    description: "Payment status update",
    example: "succeeded",
    enum: PaymentStatus,
  })
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  @IsEnum({ succeeded: PaymentStatus.SUCCEEDED, failed: PaymentStatus.FAILED })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: "Checkout session ID",
    example: "sess_12345",
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.CHECKOUT_SESSION_ID.REQUIRED })
  checkoutSessionId: string;
}
