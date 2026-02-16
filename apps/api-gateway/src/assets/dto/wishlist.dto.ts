import { ApiProperty } from "@nestjs/swagger";

import { IsMongoId } from "class-validator";

export class WishlistDto {
  @ApiProperty()
  @IsMongoId()
  assetId: string;
}
