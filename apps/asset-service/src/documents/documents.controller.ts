import { Controller } from "@nestjs/common";
import { MessagePattern, RpcException } from "@nestjs/microservices";

import { DocumentService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";

@Controller()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @MessagePattern("create_documents")
  async create(data: { assetId: string; dto: CreateDocumentDto; files: any }) {
    try {
      return this.documentService.create(data.assetId, data.dto, data.files);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern("find_all_documents")
  async findAll(data: { page: number; limit: number }) {
    try {
      return this.documentService.findAll(data.page, data.limit);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern("find_one_document")
  async findByDocument(data: { assetId: string; documentId: string }) {
    try {
      return this.documentService.findByDocument(data.assetId, data.documentId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern("remove_document")
  async remove(data: { assetId: string; documentId: string }) {
    try {
      return this.documentService.remove(data.assetId, data.documentId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern("create_asset_tag")
  async createAssetTag(data: { assetId: string; tagId: string }) {
    try {
      return this.documentService.createTag(data.assetId, data.tagId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern("find_one_tag")
  async findByAssetTag(data: { assetId: string }) {
    try {
      return this.documentService.findByAssetTag(data.assetId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern("update_asset_tag")
  async updateAssetTag(data: { assetId: string; tag: string }) {
    try {
      return this.documentService.updateAssetTag(data.assetId, data.tag);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }
}
