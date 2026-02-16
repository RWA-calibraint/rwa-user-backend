import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Model } from "mongoose";

import { Asset } from "src/assets/schemas/asset.schema";
import { S3Service } from "src/shared-module/S3/s3.service";
import { paginate } from "src/utils/pagination.util";

import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { Document } from "./schemas/document.schema";

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document.name) private readonly documentModel: Model<Document>,
    @InjectModel(Asset.name) private readonly assetModel: Model<Asset>,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    assetId,
    createDocumentDto: CreateDocumentDto,
    files,
  ): Promise<Document> {
    const findAsset = await this.assetModel.findOne({ assetId });
    if (!findAsset)
      throw new HttpException("Asset not found", HttpStatus.BAD_REQUEST);
    const fileUrls = [];
    for (const file of files) {
      const fileUrl = await this.s3Service.uploadFile(file, "");
      fileUrls.push(fileUrl);
    }
    createDocumentDto["documentUrls"] = fileUrls;
    createDocumentDto["assetId"] = assetId;
    const createdDocument = new this.documentModel(createDocumentDto);
    const savedDocument = await createdDocument.save();
    await findAsset.updateOne({
      $push: {
        documents: savedDocument._id,
      },
    });
    return savedDocument;
  }

  async findAll(page: number, limit: number) {
    return paginate<Document>(this.documentModel, page, limit, {}, { _id: -1 });
  }

  async findByDocument(assetId: string, documentId): Promise<Document[]> {
    return this.documentModel
      .find({ assetId: assetId, _id: documentId })
      .exec();
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const updatedDocument = await this.documentModel
      .findByIdAndUpdate(id, updateDocumentDto, { new: true })
      .exec();
    if (!updatedDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return updatedDocument;
  }

  async remove(assetId, documentId): Promise<Document> {
    const deletedDocument = await this.documentModel
      .findOneAndDelete({ assetId: assetId, _id: documentId })
      .exec();
    if (!deletedDocument) {
      throw new NotFoundException(
        `Document with assetId ${assetId} and documentId ${documentId} not found`,
      );
    }
    return deletedDocument;
  }

  async createTag(assetId: string, tag: string): Promise<any> {
    const createdTag = await this.assetModel
      .updateOne({ assetId }, { $set: { tag } })
      .exec();
    return createdTag;
  }

  async findByAssetTag(assetId: string): Promise<any> {
    return this.assetModel.find({ assetId: assetId }).exec();
  }

  async updateAssetTag(assetId: string, tag: string): Promise<any> {
    const updatedtag = await this.assetModel
      .updateOne({ assetId }, { $set: { tag: tag } })
      .exec();
    if (!updatedtag) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }
    return updatedtag;
  }
}
