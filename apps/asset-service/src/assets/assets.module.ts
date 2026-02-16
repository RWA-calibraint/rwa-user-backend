import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";

import { AssetsController } from "src/assets/assets.controller";
import { AssetsService } from "src/assets/assets.service";
import { AssetRepository } from "src/assets/repository/asset.repository";
import { ExclusiveAccessRepository } from "src/assets/repository/exclusive-access.repository";
import {
  AssetDraft,
  AssetDraftSchema,
} from "src/assets/schemas/asset-draft.schema";
import { Asset, AssetSchema } from "src/assets/schemas/asset.schema";
import {
  AssetCategory,
  AssetCategorySchema,
} from "src/assets/schemas/category.schema";
import { multerConfig } from "src/config/multer.config";
import {
  Document,
  DocumentSchema,
} from "src/documents/schemas/document.schema";
import { NotificationService } from "src/shared-module/notification/notification.service";
import {
  Admin,
  AdminSchema,
} from "src/shared-module/notification/schema/admin.schema";
import {
  Notification,
  NotificationSchema,
} from "src/shared-module/notification/schema/notification.schema";
import { S3Service } from "src/shared-module/S3/s3.service";
import { SendGridServices } from "src/shared-module/send-grid/send-grid.services";

import { TokenRepository } from "./repository/token.repository";
import {
  AssetListing,
  AssetListingSchema,
} from "./schemas/asset-listing.schema";
import {
  ExclusiveAccess,
  ExclusiveAccessSchema,
} from "./schemas/exclusive-access.schema";
import {
  PriceHistory,
  PriceHistorySchema,
} from "./schemas/price_history.schema";
import { Token, TokenSchema } from "./schemas/token.schema";
import { User, UserSchema } from "./schemas/user.schema";
import { WishlistAsset, WishlistAssetSchema } from "./schemas/wishlist.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: AssetDraft.name, schema: AssetDraftSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: User.name, schema: UserSchema },
      { name: AssetCategory.name, schema: AssetCategorySchema },
      { name: WishlistAsset.name, schema: WishlistAssetSchema },
      { name: PriceHistory.name, schema: PriceHistorySchema },
      { name: ExclusiveAccess.name, schema: ExclusiveAccessSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AssetListing.name, schema: AssetListingSchema },
    ]),
    MulterModule.register(multerConfig),
  ],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    S3Service,
    AssetRepository,
    ExclusiveAccessRepository,
    TokenRepository,
    SendGridServices,
    NotificationService,
  ],
  exports: [AssetsService],
})
export class AssetsModule {}
