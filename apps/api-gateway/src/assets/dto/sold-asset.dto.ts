import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

import { PaginationDto } from "src/shared-kernel/dto/pagination.dto";

export class SoldAssetDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Search by asset name",
    example: "vishnu",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  searchValue?: string;

  @ApiPropertyOptional({
    description: "Filter sold Assets by categories",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",");
    }
    return value;
  })
  categories?: string[];

  @ApiPropertyOptional({
    description: "Filter orders date from",
    example: "2025-03-23",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return String(value).trim();
  })
  from?: Date;

  @ApiPropertyOptional({
    description: "Filter orders date to",
    example: "2025-03-23",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return String(value).trim();
  })
  to?: Date;

  @IsOptional()
  @IsString()
  min: string;

  @IsOptional()
  @IsString()
  max: string;

  @IsOptional()
  @IsString()
  sortBy: string;
}
