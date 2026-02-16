import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsNotEmpty, Matches } from "class-validator";

import { ERROR_MESSAGES } from "src/shared-kernel/utils/constants/exceptions/error-message";
import { USER_NAME_REGEX } from "src/shared-kernel/utils/constants/exceptions/regex";

export class KycDto {
  @ApiProperty({
    description: "The first name of the user",
    example: "John",
  })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: ERROR_MESSAGES.NAME.REQUIRED })
  @Matches(USER_NAME_REGEX, { message: ERROR_MESSAGES.NAME.INVALID_NAME })
  firstName: string;

  @ApiProperty({
    description: "The last name of the user",
    example: "dee",
  })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: ERROR_MESSAGES.NAME.REQUIRED })
  @Matches(USER_NAME_REGEX, { message: ERROR_MESSAGES.NAME.INVALID_NAME })
  lastName: string;

  @ApiProperty({
    description: "The password of the user",
    example: "Test@123",
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMAIL.REQUIRED })
  email: string;
}
