import { ApiProperty } from "@nestjs/swagger";

import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

export class CreateDocumentDto {
  @ApiProperty({ description: "Document title" })
  @IsString()
  @Matches(/\S/, { message: "Name must not be empty or contain only spaces" })
  name: string;

  @ApiProperty({ description: "Document type" })
  @IsString()
  @Matches(/\S/, { message: "Type must not be empty or contain only spaces" })
  type: string;

  @ApiProperty({ description: "Document verification status" })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({ description: "Verified by user ID" })
  @IsString()
  @IsOptional()
  verifiedBy?: string;
}

export class UploadDocumentDto {
  @ApiProperty({ description: "Pdf encryption password" })
  @IsString()
  @IsOptional()
  password: string;
}
