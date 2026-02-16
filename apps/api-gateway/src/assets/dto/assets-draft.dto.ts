import { ApiProperty } from "@nestjs/swagger";

import { Transform } from "class-transformer";
import { IsArray, IsObject, IsOptional, IsString } from "class-validator";

export class DocumentInterface {
  @IsString()
  @IsOptional()
  url: string;

  @IsString()
  @IsOptional()
  name: string;
}
export class AssetsDraftDto {
  @ApiProperty({ example: "Luxury Painting", description: "Name of the asset" })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    example: "An exclusive piece of art",
    description: "Description of the asset",
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ example: 5000, description: "Price of the asset" })
  @IsString()
  @IsOptional()
  price: string;

  @ApiProperty({
    example: "65bff54d68f6bc001e6b2c78",
    description: "Category ID (ObjectId)",
  })
  @IsString()
  @IsOptional()
  category: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: "USA", description: "Country of the asset" })
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty({ example: "California", description: "State of the asset" })
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty({ example: "LA", description: "City of the asset" })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({
    example: "123 Main St, Los Angeles",
    description: "Address of the asset",
  })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({ example: "90001", description: "Pincode of the asset" })
  @IsString()
  @IsOptional()
  pincode: string;

  @ApiProperty({ description: "Documents for the asset (PDFs or images)" })
  @Transform(({ value: documents }) => JSON.parse(documents))
  @IsObject()
  @IsOptional()
  documents: Record<string, DocumentInterface[]>;
}
