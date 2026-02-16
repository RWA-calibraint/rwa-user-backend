import { IsNotEmpty, IsString } from "class-validator";

import { ERROR_MESSAGES } from "src/shared-kernel/constants/exceptions/error-message";

export class StripeAccountIdValidation {
  @IsNotEmpty({ message: ERROR_MESSAGES.STRIPE.ACCOUNT_ID.REQUIRED })
  @IsString({ message: ERROR_MESSAGES.STRIPE.ACCOUNT_ID.IS_STRING })
  accountId: string;
}
