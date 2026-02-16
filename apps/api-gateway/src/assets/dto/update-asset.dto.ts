import { PartialType } from "@nestjs/swagger";

import { IsMongoId, IsOptional, IsString } from "class-validator";

import { CreateAssetDto } from "src/assets/dto/create-asset.dto";

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
