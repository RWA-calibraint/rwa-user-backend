import { ApiProperty } from "@nestjs/swagger";

import { IsNotEmpty, IsString } from "class-validator";

export class AadhaarVerifyOtpDto {
  @ApiProperty({
    description: "Reference ID from OTP generation",
    example: "1234567",
  })
  @IsNotEmpty({ message: "Reference ID is required" })
  @IsString()
  referenceId: string;

  @ApiProperty({
    description: "OTP received on Aadhaar-linked mobile",
    example: "123456",
  })
  @IsNotEmpty({ message: "OTP is required" })
  @IsString()
  otp: string;
}
