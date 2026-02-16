import { ApiPropertyOptional } from "@nestjs/swagger";

import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

enum STATUS_TYPE {
  SUBMITTED = "submitted",
  ADJUSTMENT_REQUIRED = "adjustmentRequired",
  APPROVED = "approved",
  REJECTED = "rejected",
  HOLD = "hold",
  DE_LIST = "delist",
  DRAFT = "draft,",
}

export class AssetStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(STATUS_TYPE)
  @ApiPropertyOptional({ description: "Asset Status", required: true })
  status: STATUS_TYPE;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Asset Category" })
  category?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Asset Search" })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Page Number" })
  page?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Limit Per Page" })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "StartDate" })
  startDate?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "endDate" })
  endDate?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "Minimum" })
  min?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "maximum" })
  max?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: "sortBy" })
  sortBy?: string;
}
