import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { firstValueFrom } from "rxjs";
import * as sharp from "sharp";

import { AssetsDraftDto } from "src/assets/dto/assets-draft.dto";
import { CreateAssetDto } from "src/assets/dto/create-asset.dto";
import { UpdateAssetDto } from "src/assets/dto/update-asset.dto";
import { WishlistDto } from "src/assets/dto/wishlist.dto";
import { multerConfig } from "src/config/multer.config";
import { CACHE_KEYS } from "src/shared-kernel/constants/cache-keys";
import { ERROR_MESSAGES } from "src/shared-kernel/constants/error-message";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";
import { SkipAuth } from "src/shared-kernel/custom-decorators/skip-auth.decorator";
import { RedisService } from "src/shared-kernel/redis-cache/redis.service";
import { encryptPdfWithPassword } from "src/shared-kernel/service/pdf-encryption/pdf-encrypt";
import { S3Service } from "src/shared-kernel/service/S3/s3.service";
import {
  constructErrorResponse,
  constructSuccessResponse,
} from "src/utils/helper";
import {
  calculateMotionBlur,
  calculateOverallScore,
  calculateSharpness,
  determineQualityLevel,
  estimateImageNoise,
  getQualityRecommendation,
} from "src/utils/utilities";

import {
  AnalyzeImageResponseDto,
  ImageMetadata,
  ImageQualityMetrics,
} from "./dto/analyze-image.dto";
import { AssetStatusDto } from "./dto/asset-by-status.dto";
import { AssetListingDto } from "./dto/asset-listing.dto";
import { UploadDocumentDto } from "./dto/create-document.dto";
import { SoldAssetDto } from "./dto/sold-asset.dto";
import { SubmitExclusiveAccessDto } from "./dto/submit-exclusive-access.dto";

const supportedFormats = [
  "jpeg",
  "jpg",
  "png",
  "webp",
  "gif",
  "svg",
  "tiff",
  "avif",
  "heif",
  "raw",
  "dz",
  "jxl",
  "jp2",
];
@ApiTags("assets")
@Controller("api/assets")
export class AssetsController {
  constructor(
    @Inject(MICRO_SERVICES.ASSET_SERVICE.NAME)
    private readonly assetClient: ClientProxy,
    private readonly redisService: RedisService,
    private readonly s3Service: S3Service,
  ) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Create Asset Api" })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "cover", maxCount: 1 },
        { name: "images", maxCount: 10 },
      ],
      multerConfig,
    ),
  )
  async create(
    @Req() request,
    @UploadedFiles()
    files: { cover: Express.Multer.File[]; images: Express.Multer.File[] },
    @Body() assetDto: CreateAssetDto,
  ) {
    try {
      if (!files.images || files.images.length === 0) {
        throw new HttpException("No images uploaded", HttpStatus.BAD_REQUEST);
      }
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const coverImageUrl = files.cover
        ? await this.s3Service.uploadFile(
            files.cover[0].path,
            files.cover[0]?.mimetype,
          )
        : null;

      const imageUrls = await Promise.all(
        files.images.map((image) =>
          this.s3Service.uploadFile(image.path, image.mimetype),
        ),
      );
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.CREATE_ASSET,
          {
            dto: assetDto,
            coverImageUrl,
            imageUrls,
            userId,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      Logger.error(error, "Create Asset Error");
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Post("create-documents")
  @ApiOperation({
    summary: "Upload a documents to s3 while creating the asset ",
  })
  @ApiResponse({
    status: 200,
    description: "Documents S3 URL will be provided",
  })
  @ApiResponse({ status: 404, description: "Bads request" })
  @UseInterceptors(FileInterceptor("file", multerConfig))
  async createDocuments(
    @UploadedFile() documentDetails: Express.Multer.File,
    @Body() documentDto: UploadDocumentDto,
  ) {
    try {
      let filePathToUpload = documentDetails.path;
      if (
        documentDto.password &&
        documentDetails.mimetype === "application/pdf"
      ) {
        filePathToUpload = await encryptPdfWithPassword(
          documentDetails.path,
          documentDto.password,
        );
      }
      const result = await this.s3Service.uploadFile(
        filePathToUpload,
        documentDetails?.mimetype,
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("status/list")
  @ApiOperation({ summary: "Get Assets By status Api" })
  async fetchAssetListbyStatus(
    @Req() request,
    @Query() assetStatus: AssetStatusDto,
  ) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FETCH_ASSET_BY_STATUS,
          {
            userDetails: request.user,
            status: assetStatus,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("list")
  @ApiOperation({ summary: "Get Assets list with pagination and search Api" })
  async findAll(
    @Query("page") page,
    @Query("limit") limit,
    @Query("search") search?: string,
  ) {
    try {
      const cacheKey = CACHE_KEYS.ASSET_LIST(page, limit, search);
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return constructSuccessResponse(JSON.parse(cachedData));
      }
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.LIST_ASSETS,
          { page, limit, search },
        ),
      );
      await this.redisService.set(cacheKey, JSON.stringify(result), 300);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @SkipAuth()
  @Get("live/list")
  @ApiOperation({ summary: "Get Live Assets Api" })
  async findLiveAssets(@Req() request) {
    try {
      let userDetails = null;
      if (request?.cookies?.user) {
        try {
          userDetails = JSON.parse(request.cookies.user);
        } catch (e) {
          console.error("Failed to parse user cookie:", e);
        }
      }
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.LIVE_ASSETS,
          { userDetails },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @SkipAuth()
  @Get("featured/:assetId/live")
  @ApiOperation({ summary: "Get Featured Live Assets Api" })
  async convertToLive(@Param("assetId") assetId: string) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.BUY_ASSET,
          { assetId },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("wishlist")
  @ApiOperation({ summary: "Get Wishlists Api" })
  async fetchUserWishlist(
    @Req() request,
    @Query("filters") filters: string,
    @Query("pagination") pagination: string,
  ) {
    try {
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FETCH_WISHLIST_ASSET,
          { userId, filters, pagination },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Post("wishlist")
  @ApiOperation({ summary: "Add Wishlist Api" })
  async wishlistAsset(@Req() request, @Body() wishlistDto: WishlistDto) {
    try {
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.WISHLIST_ASSET,
          {
            userId,
            assetId: wishlistDto.assetId,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("wishlist-count")
  @ApiOperation({ summary: "Get Wishlist Count Api" })
  async fetchWishlistAssetCount(@Query("assetId") assetId: string) {
    try {
      if (!assetId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.ASSET_NOT_FOUND,
        });
      }
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FETCH_WISHLIST_ASSET_COUNT,
          { assetId },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Post("views")
  @ApiOperation({ summary: "Add Views Api" })
  async assetViews(@Req() request, @Query("assetId") assetId: string) {
    try {
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.ASSET_VIEWS,
          { userId, assetId },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("views-count")
  @ApiOperation({ summary: "Get Views Count Api" })
  async fetchAssetViewCount(@Query("assetId") assetId: string) {
    try {
      if (!assetId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FETCH_ASSET_VIEWS_COUNT,
          { assetId },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("sold")
  @ApiOperation({ summary: "Get Sold Assets Api" })
  async getAllSoldAssets(
    @Req() request,
    @Query() soldAssetQuery: SoldAssetDto,
  ) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.SOLD_ASSET,
          {
            userId: request?.user?.result?._id,
            ...soldAssetQuery,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("draft")
  @ApiOperation({ summary: "Get Draft Asset Api" })
  async getAssetDraft(@Req() request) {
    try {
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.GET_ASSET_DRAFT,
          {
            userDetails: request?.user,
          },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("partial-search")
  @ApiOperation({ summary: "Assets Partial Search Api" })
  async assetPartialSearch(@Query("searchValue") searchValue: string) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.ASSET_PARTIAL_SEARCH,
          searchValue,
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get(":assetId")
  @ApiOperation({ summary: "Get Asset Api" })
  async findOne(@Param("assetId") assetId: string, @Req() request) {
    try {
      // TODO: Need to work on the future
      // const cacheKey = CACHE_KEYS.ASSET_DETAILS(assetId);
      // const cachedData = await this.redisService.get(cacheKey);
      // if (cachedData) {
      //   return constructSuccessResponse(JSON.parse(cachedData));
      // }
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FIND_ASSET,
          {
            assetId,
            userId: request?.user?.result?._id,
          },
        ),
      );
      // await this.redisService.set(cacheKey, JSON.stringify(result), 600);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Post(":assetId/update")
  @ApiOperation({ summary: "Update Asset Api" })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "cover", maxCount: 1 },
        { name: "images", maxCount: 10 },
      ],
      multerConfig,
    ),
  )
  async update(
    @Req() request,
    @UploadedFiles()
    files: {
      cover: Express.Multer.File[];
      images: Express.Multer.File[];
    },
    @Param("assetId") assetId: string,
    @Body() assetDto: UpdateAssetDto,
  ) {
    try {
      if (!files.images || files.images.length === 0) {
        throw new HttpException("No images uploaded", HttpStatus.BAD_REQUEST);
      }
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const coverImageUrl = files.cover
        ? await this.s3Service.uploadFile(
            files.cover[0].path,
            files.cover[0]?.mimetype,
          )
        : null;

      const imageUrls = await Promise.all(
        files.images.map((image) =>
          this.s3Service.uploadFile(image.path, image.mimetype),
        ),
      );

      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.UPDATE_ASSET,
          {
            assetId,
            dto: assetDto,
            coverImageUrl,
            imageUrls,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Delete(":assetId/delete")
  @ApiOperation({ summary: "Delete Asset Api" })
  async remove(@Param("assetId") assetId: string) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.REMOVE_ASSET,
          { assetId },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("category/list")
  @ApiOperation({ summary: "Get Asset Category Api" })
  async getCategoriesList() {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.CATEGORY_LIST,
          {},
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Delete("listings/:listingId/delete")
  @ApiOperation({ summary: "Delete Asset listing Api" })
  async deleteListings(@Param("listingId") listingId: string) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.DELETE_LISTINGS,
          {
            id: listingId,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("tag/:tagId")
  @ApiOperation({ summary: "Get Asset Tag Api" })
  async findAssetTag(@Param("tagId") tagId: string) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FIND_ASSET_TAG,
          { tagId },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Post("tag/scan")
  @ApiOperation({ summary: "Create Asset Scan Tag Api" })
  async scanTag(@Body() scanDto: any) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.QR_CODE_SCAN,
          {
            assetId: scanDto.assetId,
            qrCode: scanDto.qrCode,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("collections/count")
  @ApiOperation({ summary: "Get Asset Collections Count Api" })
  async fetchUserCollectionsCount(@Req() request) {
    try {
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT
            .FETCH_USER_COLLECTIONS_COUNT,
          { userId: request?.user?.result?._id },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("collections/list")
  @ApiOperation({ summary: "Get Asset Collections List Api" })
  async fetchUserCollections(
    @Req() request,
    @Query("type") type: string,
    @Query("filters") filters: string,
    @Query("pagination") pagination: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FETCH_USER_COLLECTIONS,
          { userId: request?.user?.result?._id, type, filters, pagination },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("user/:userId")
  @ApiOperation({ summary: "Get Asset By User Api" })
  async findAssetByUser(@Param("userId") userId: string) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.GET_USER_ASSET,
          { userId },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("category/:categoryId/images")
  @ApiOperation({ summary: "Fetch Images By Asset Api" })
  async fetchImagesByAsset(@Param("categoryId") categoryId: string) {
    try {
      const cacheKey = CACHE_KEYS.CATEGORY_IMAGES(categoryId);
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return constructSuccessResponse(JSON.parse(cachedData));
      }
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.IMAGES_BY_CATEGORY,
          { categoryId },
        ),
      );
      await this.redisService.set(cacheKey, JSON.stringify(result), 600);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @SkipAuth()
  @Get("/:assetId/price/history")
  @ApiOperation({ summary: "Get Asset Price History Api" })
  async fetchPriceHistory(@Param("assetId") assetId: string) {
    try {
      //TODO: Need to configure redis cache
      // const cacheKey = CACHE_KEYS.PRICE_HISTORY(assetId);
      // const cachedData = await this.redisService.get(cacheKey);
      // if (cachedData) {
      //   return constructSuccessResponse(JSON.parse(cachedData));
      // }
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.PRICE_HISTORY,
          { assetId },
        ),
      );
      // await this.redisService.set(cacheKey, JSON.stringify(result), 300);
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("submission/count")
  @ApiOperation({ summary: "Get Asset Submission Count Api" })
  async getSubmissionsCount(@Req() request) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.SUBMISSION_COUNT,
          {
            userDetails: request.user,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("/exclusive-access")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit the exclusive access to the user" })
  @ApiBody({ type: SubmitExclusiveAccessDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  async submitExclusiveAsset(
    @Req() request,
    @Body() { assetId }: SubmitExclusiveAccessDto,
  ) {
    try {
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.SUBMIT_EXCLUSIVE_ACCESS,
          {
            userDetails: request.user,
            assetId,
          },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("exclusive-access/:assetId")
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: "assetId",
    description: "The unique ID of the asset",
    example: "67da3b3e8633af7d03dd5478",
  })
  @ApiOperation({ summary: "Get the exclusive access for the user." })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  async getExclusiveAccess(@Req() request, @Param("assetId") assetId: string) {
    try {
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.GET_EXCLUSIVE_ACCESS,
          {
            userDetails: request.user,
            assetId,
          },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Get("fetch-user/notification")
  @ApiOperation({ summary: "Get User Notifications Api" })
  async fetchUserNotifications(@Req() request) {
    try {
      const userId = request?.user?.result?._id;
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.FETCH_ALL_NOTIFICATIONS,
          { userId },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("notification/read/:notificationId")
  @ApiParam({ name: "notificationId" })
  @ApiOperation({ summary: "Create Notification Api" })
  async markNotificationAsRead(
    @Param("notificationId") notificationId: string,
  ) {
    try {
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.READ_NOTIFICATION,
          { notificationId },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("notification/all-read")
  @ApiOperation({ summary: "Mark All Notification as Read Api" })
  async markAllNotificationAsRead(@Req() request) {
    try {
      const userId = request?.user?.result?._id;
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.READ_ALL_NOTIFICATIONS,
          { userId },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("analyze")
  @ApiOperation({ summary: "Analyze image quality" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Image analysis results",
    type: AnalyzeImageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid file or no file uploaded",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
          description: "Image file to analyze",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("image"))
  async analyzeImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: ".(jpg|jpeg|png|webp)" }),
        ],
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    file: Express.Multer.File,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException("No image file uploaded");
    }
    try {
      const metadata = await sharp(file.buffer).metadata();

      if (!metadata.format) {
        throw new Error("Unknown image format");
      }

      if (!supportedFormats.includes(metadata.format.toLowerCase())) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      if (!metadata.width || !metadata.height) {
        throw new Error("Invalid image dimensions");
      }

      const isAnimated = metadata.pages && metadata.pages > 1;

      const imageData = await sharp(file.buffer)
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const sharpness = calculateSharpness(
        imageData.data,
        imageData.info.width,
        imageData.info.height,
      );
      const motionBlur = calculateMotionBlur(
        imageData.data,
        imageData.info.width,
        imageData.info.height,
      );
      const noise = estimateImageNoise(
        imageData.data,
        imageData.info.width,
        imageData.info.height,
      );

      const blurScore = 1 - sharpness;
      const overallScore = calculateOverallScore(sharpness, motionBlur, noise);

      const analysisMetadata: ImageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: file.buffer.length,
        isAnimated: isAnimated || false,
        colorSpace: metadata.space || "unknown",
        hasAlpha: metadata.hasAlpha || false,
        pageCount: metadata.pages || 1,
      };

      const qualityMetrics: ImageQualityMetrics = {
        sharpness: Number(sharpness.toFixed(4)),
        blurScore: Number(blurScore.toFixed(4)),
        motionBlur: Number(motionBlur.toFixed(4)),
        noise: Number(noise.toFixed(4)),
        overallScore: Number(overallScore.toFixed(4)),
        qualityLevel: determineQualityLevel(overallScore),
      };

      return constructSuccessResponse({
        metadata: analysisMetadata,
        quality: qualityMetrics,
        recommendation: getQualityRecommendation(overallScore, metadata.format),
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image analysis failed: ${error.message}`);
      }
      throw new Error("Unknown error during image analysis");
    }
  }

  @SkipAuth()
  @Get("feature/asset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the feature asset" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  async getFeatureAsset(@Req() request) {
    try {
      let userDetails = null;
      if (request?.cookies?.user) {
        try {
          userDetails = JSON.parse(request.cookies.user);
        } catch (e) {
          console.error("Failed to parse user cookie:", e);
        }
      }
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.GET_FEATURE_ASSET,
          { userDetails: userDetails },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("draft")
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "images", maxCount: 10 }], multerConfig),
  )
  @ApiOperation({ summary: "Create Asset Draft Api" })
  async assetDraft(
    @UploadedFiles()
    files: { cover: Express.Multer.File[]; images: Express.Multer.File[] },
    @Body() assetDraftData: AssetsDraftDto,
    @Req() request,
  ) {
    try {
      if (files?.images || files?.images?.length > 0) {
        const images = await Promise.all(
          files.images.map((image) =>
            this.s3Service.uploadFile(image.path, image.mimetype),
          ),
        );
        assetDraftData.images = images;
      }

      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.ASSETS_DRAFT,
          {
            assetDraftData,
            userDetails: request.user,
          },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Delete("draft/:draftId")
  @ApiOperation({ summary: "Delete Asset Draft Api" })
  async deleteAssetDraft(@Param("draftId") draftId: string) {
    try {
      const response = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.DELETE_ASSET_DRAFT,
          {
            draftId,
          },
        ),
      );
      return constructSuccessResponse(response);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @ApiBearerAuth()
  @Post("token/list")
  @ApiOperation({ summary: "Create Asset Token Listing Api" })
  async assetListing(@Req() request, @Body() listingDto: AssetListingDto) {
    try {
      const userId = request?.user?.result?._id;
      const result = await firstValueFrom(
        this.assetClient.send(
          MICRO_SERVICES.ASSET_SERVICE.MESSAGE_EVENT.ASSET_LISTING,
          {
            userId,
            listingDto,
          },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
