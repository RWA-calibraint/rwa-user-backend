import { ApiProperty } from "@nestjs/swagger";

import { IsNotEmpty } from "class-validator";

import { ERROR_MESSAGES } from "src/shared-kernel/constants/exceptions/error-message";
import { EmailValidationDto } from "src/shared-kernel/dto/email-validation.dto";

export class SigninDto extends EmailValidationDto {
  @ApiProperty({
    description: "The password of the user",
    example: "Test@123",
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.PASSWORD.REQUIRED })
  password: string;
}
