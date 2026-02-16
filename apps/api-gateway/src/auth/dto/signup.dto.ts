import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsNotEmpty, Matches } from "class-validator";

import { SigninDto } from "src/auth/dto/signin.dto";
import { ERROR_MESSAGES } from "src/shared-kernel/constants/exceptions/error-message";
import { USER_NAME_REGEX } from "src/shared-kernel/constants/regexs";

export class SignupDto extends SigninDto {
  @ApiProperty({
    description: "The first name of the user",
    example: "Vishnu",
  })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: ERROR_MESSAGES.NAME.REQUIRED })
  @Matches(USER_NAME_REGEX, { message: ERROR_MESSAGES.NAME.INVALID_NAME })
  firstName: string;

  @ApiProperty({
    description: "The last name of the user",
    example: "prasath",
  })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: ERROR_MESSAGES.NAME.REQUIRED })
  lastName: string;
}
