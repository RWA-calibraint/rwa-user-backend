import { registerDecorator, ValidationOptions } from "class-validator";

import { ValidateId } from "src/shared-kernel/custom-validators/object-id.validator";

export function IsValidObjectId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateId,
    });
  };
}
