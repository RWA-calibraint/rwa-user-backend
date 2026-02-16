import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiOperation, ApiParam } from "@nestjs/swagger";

import { firstValueFrom } from "rxjs";

import { multerConfig } from "src/config/multer.config";
import { CACHE_KEYS } from "src/shared-kernel/constants/cache-keys";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";
import { RedisService } from "src/shared-kernel/redis-cache/redis.service";
import {
  constructErrorResponse,
  constructSuccessResponse,
} from "src/utils/helper";

import { CreateDocumentDto } from "./dto/create-document.dto";

@Controller("api/assets/:assetId")
export class DocumentController {
  constructor(
    @Inject(MICRO_SERVICES.ASSET_SERVICE.NAME)
    private readonly documentClient: ClientProxy,
    private readonly redisService: RedisService,
  ) {}

  @Post("documents")
  @ApiOperation({ summary: "Upload Documents Api" })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "files", maxCount: 5 }], multerConfig),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Param("assetId") assetId: string,
    @Body() documentDto: CreateDocumentDto,
  ): Promise<any> {
    try {
      if (!files || files.length === 0) {
        throw new HttpException("No files uploaded", HttpStatus.BAD_REQUEST);
      }
      const filePaths = files["files"].map((file) => file.path);
      const result = await firstValueFrom(
        this.documentClient.send("create_document", {
          assetId,
          dto: documentDto,
          files: filePaths,
        }),
      );
      await this.redisService.delByPattern(CACHE_KEYS.DOCUMENT_LIST_PATTERN);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("documents")
  @ApiParam({
    name: "AssetId",
    description: "Pass the right assetId",
    example: "6819b8769a1d992b6cc89996",
  })
  @ApiOperation({ summary: "Get All Documents Api" })
  async findAll(@Query("page") page, @Query("limit") limit) {
    try {
      const cacheKey = CACHE_KEYS.DOCUMENT_LIST(page, limit);
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return constructSuccessResponse(JSON.parse(cachedData));
      }
      const result = await firstValueFrom(
        this.documentClient.send("find_all_documents", { page, limit }),
      );
      await this.redisService.set(cacheKey, JSON.stringify(result), 300);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("documents/:documentId")
  @ApiOperation({ summary: "Get Document Api" })
  async findByDocument(
    @Param("assetId") assetId: string,
    @Param("documentId") documentId: string,
  ) {
    try {
      const cacheKey = CACHE_KEYS.DOCUMENT_DETAILS(documentId);
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return constructSuccessResponse(JSON.parse(cachedData));
      }
      const result = await firstValueFrom(
        this.documentClient.send("find_one_document", { assetId, documentId }),
      );
      await this.redisService.set(cacheKey, JSON.stringify(result), 600);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Delete("documents/:documentId")
  @ApiOperation({ summary: "Delete Document Api" })
  async remove(
    @Param("assetId") assetId: string,
    @Param("documentId") documentId: string,
  ) {
    try {
      const result = await firstValueFrom(
        this.documentClient.send("remove_document", { assetId, documentId }),
      );
      const cacheKey = CACHE_KEYS.DOCUMENT_DETAILS(documentId);
      await this.redisService.del(cacheKey);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("tag")
  @ApiOperation({ summary: "Create Asset Tag Api" })
  async createTag(@Param("assetId") assetId: string, @Body() tagDto: any) {
    try {
      const result = await firstValueFrom(
        this.documentClient.send("create_asset_tag", {
          assetId,
          tagId: tagDto.tagId,
        }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("tag")
  @ApiOperation({ summary: "Get Asset Tag Api" })
  async findAssetTag(@Param("assetId") assetId: string) {
    try {
      const result = await firstValueFrom(
        this.documentClient.send("find_one_tag", { assetId }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Put("tag")
  @ApiOperation({ summary: "Update Asset Tag Api" })
  async updateAssetTag(@Param("assetId") assetId: string, @Body() tagDto: any) {
    try {
      const result = await firstValueFrom(
        this.documentClient.send("update_asset_tag", {
          assetId,
          tagId: tagDto.tagId,
        }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
