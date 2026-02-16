import { ApiProperty } from "@nestjs/swagger";

import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

// Enum for Escrow Status
export enum EscrowStatus {
  PENDING = "pending",
  RELEASED = "released",
  DISPUTED = "disputed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

// DTO for Escrow Conditions
export class EscrowCondition {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO for Creating an Escrow
export class CreateEscrowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[];

  @ApiProperty({ required: false, type: [EscrowCondition] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EscrowCondition)
  @IsOptional()
  conditions?: EscrowCondition[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}

// DTO for Releasing an Escrow
export class ReleaseEscrowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  releasedBy: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// DTO for Disputing an Escrow
export class DisputeEscrowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  evidenceDocuments: string[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO for Updating an Escrow
export class UpdateEscrowDto {
  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[];

  @ApiProperty({ required: false, type: [EscrowCondition] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EscrowCondition)
  @IsOptional()
  conditions?: EscrowCondition[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: Date;

  @ApiProperty({ enum: EscrowStatus, required: false })
  @IsEnum(EscrowStatus)
  @IsOptional()
  status?: EscrowStatus;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  releaseDate?: Date;
}

// DTO for Submitting a Document
export class SubmitDocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  documentUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
