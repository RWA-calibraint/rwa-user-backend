import { ApiPropertyOptional } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";

import { PAYMENT_STATUS } from "src/shared-kernel/constants/payment-status";
import { PaginationDto } from "src/shared-kernel/dto/pagination.dto";

export class GetOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Search by asset name",
    example: "vishnu",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  searchValue?: string;

  @ApiPropertyOptional({
    description: "Payment status",
    example: PAYMENT_STATUS.COMPLETED,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsEnum(PAYMENT_STATUS, { each: true })
  paymentStatus?: PAYMENT_STATUS;

  @ApiPropertyOptional({
    description: "Filter orders by categories",
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
}
