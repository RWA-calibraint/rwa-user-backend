import { registerDecorator, ValidationOptions } from "class-validator";

import { ValidateEmail } from "../custom-validators/email.validator";

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateEmail,
    });
  };
}
