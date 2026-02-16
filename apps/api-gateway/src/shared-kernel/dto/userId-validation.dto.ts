import { IsValidObjectId } from "src/shared-kernel/custom-decorators/is-valid-mongoose-id";

export class UserIdValidationDto {
  @IsValidObjectId()
  userId: string;
}
