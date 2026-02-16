import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsOptional, IsString } from "class-validator";

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

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastActive?: Date;

  @IsOptional()
  @IsString()
  profilePic?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsString()
  kytServiceRequest?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsString()
  kycVerificationStatus?: string;

  @IsOptional()
  @IsString()
  kycVerificationDetails?: string;
}
