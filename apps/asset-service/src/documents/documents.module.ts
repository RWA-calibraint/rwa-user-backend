import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Asset, AssetSchema } from "src/assets/schemas/asset.schema";
import { DocumentController } from "src/documents/documents.controller";
import { DocumentService } from "src/documents/documents.service";
import {
  Document,
  DocumentSchema,
} from "src/documents/schemas/document.schema";
import { S3Service } from "src/shared-module/S3/s3.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
      { name: Asset.name, schema: AssetSchema },
    ]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService, S3Service],
  exports: [DocumentService],
})
export class DocumentsModule {}
