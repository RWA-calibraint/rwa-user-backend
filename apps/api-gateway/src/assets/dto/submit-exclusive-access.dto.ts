import { ApiProperty } from "@nestjs/swagger";

import mongoose from "mongoose";

import { IsValidObjectId } from "src/shared-kernel/custom-decorators/is-valid-mongoose-id";

export class SubmitExclusiveAccessDto {
  @ApiProperty({ description: "Asset id" })
  @IsValidObjectId()
  assetId: mongoose.Types.ObjectId;
}
