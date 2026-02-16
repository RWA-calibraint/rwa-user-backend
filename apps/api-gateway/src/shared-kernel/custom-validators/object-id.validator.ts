import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isValidObjectId } from "mongoose";

import { ERROR_MESSAGES } from "src/shared-kernel/constants/exceptions/error-message";

@ValidatorConstraint()
export class ValidateId implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return isValidObjectId(value);
  }
  defaultMessage(): string {
    return ERROR_MESSAGES.OBJECT_ID.VALID;
  }
}
