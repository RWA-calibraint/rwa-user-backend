import { ApiProperty } from "@nestjs/swagger";

import { IsMongoId, IsNotEmpty, IsNumber } from "class-validator";

export class AssetListingDto {
  @ApiProperty()
  @IsMongoId()
  assetId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  tokens: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  tokenPrice: number;
}
