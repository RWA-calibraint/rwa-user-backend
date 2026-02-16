import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum STATUS_TYPE {
  SUBMITTED = "submitted",
  RESUBMISSION = "Re-submitted",
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
  status: STATUS_TYPE;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: number;

  @IsOptional()
  @IsString()
  limit?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  min?: string;

  @IsOptional()
  @IsString()
  max?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;
}
