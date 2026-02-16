import { ApiProperty } from "@nestjs/swagger";

import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class AadhaarGenerateOtpDto {
  @ApiProperty({
    description: "12-digit Aadhaar number",
    example: "999999990019",
  })
  @IsNotEmpty({ message: "Aadhaar number is required" })
  @IsString()
  @Length(12, 12, { message: "Aadhaar number must be exactly 12 digits" })
  @Matches(/^\d{12}$/, { message: "Aadhaar number must contain only digits" })
  aadhaarNumber: string;

  @ApiProperty({
    description: "Reason for verification",
    example: "KYC verification for RareAgora marketplace",
  })
  @IsNotEmpty({ message: "Reason is required" })
  @IsString()
  reason: string;
}
