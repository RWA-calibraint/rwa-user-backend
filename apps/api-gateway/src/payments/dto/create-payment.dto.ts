import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

import { ERROR_MESSAGES } from "src/shared-kernel/constants/exceptions/error-message";
import { IsValidObjectId } from "src/shared-kernel/custom-decorators/is-valid-mongoose-id";

export class CreatePaymentDto {
  @ApiProperty({ description: "Currency of the transaction", example: "USD" })
  @IsNotEmpty({ message: ERROR_MESSAGES.CURRENCY.REQUIRED })
  currency: string;

  @ApiProperty({
    description: "ID of the asset being purchased",
    example: "65df82f1b20a6e2e6b05c8c3",
  })
  @IsNotEmpty({ message: ERROR_MESSAGES.ASSET_ID.REQUIRED })
  @IsValidObjectId({})
  assetId: string;

  @ApiProperty({
    description: "No of token to be purchased",
    example: 1,
  })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  tokenCount: number;

  @ApiProperty({
    description: "Listing ID of the asset being purchased",
    example: "65df82f1b20a6e2e6b05c8c3",
  })
  @IsOptional()
  @IsMongoId()
  listingId: string;
}
