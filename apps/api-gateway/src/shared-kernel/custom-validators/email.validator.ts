import {
  isEmail,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

import { PATTERN_NO_SPECIAL_CHAR_AT_START } from "src/shared-kernel/constants/decorator-contents";
import { ERROR_MESSAGES } from "src/shared-kernel/constants/exceptions/error-message";

@ValidatorConstraint()
export class ValidateEmail implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return isEmail(value) && PATTERN_NO_SPECIAL_CHAR_AT_START.test(value);
  }
  defaultMessage(): string {
    return ERROR_MESSAGES.EMAIL.VALID_EMAIL;
  }
}
