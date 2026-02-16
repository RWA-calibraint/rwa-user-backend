import { ApiProperty } from "@nestjs/swagger";

import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDocumentDto {
  @ApiProperty({ description: "Document title" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Document type" })
  @IsString()
  @IsNotEmpty()
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
