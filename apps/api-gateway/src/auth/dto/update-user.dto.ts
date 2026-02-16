import { IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: number;

  @IsOptional()
  @IsString()
  address?: number;

  @IsOptional()
  @IsString()
  country?: number;

  @IsOptional()
  @IsString()
  state?: number;

  @IsOptional()
  @IsString()
  city?: number;

  @IsOptional()
  @IsString()
  building?: number;

  @IsOptional()
  @IsString()
  postalCode?: number;
}
