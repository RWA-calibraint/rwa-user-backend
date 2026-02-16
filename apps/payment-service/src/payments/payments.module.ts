import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { Admin, AdminSchema } from "src/admin/schema/admin.schema";
import { AssetRepository } from "src/assets/repositories/asset.repository";
import { AssetListingRepository } from "src/assets/repositories/assetListing.repository";
import { TokenRepository } from "src/assets/repositories/token.repository";
import {
  AssetListing,
  AssetListingSchema,
} from "src/assets/schemas/asset-listing.schema";
import { Asset, AssetSchema } from "src/assets/schemas/asset.schema";
import {
  AssetCategory,
  AssetCategorySchema,
} from "src/assets/schemas/category.schema";
import { Rewards, RewardsSchema } from "src/assets/schemas/rewards.schema";
import {
  TokenHistory,
  TokenHistorySchema,
} from "src/assets/schemas/token-history.schema";
import {
  TokenTransaction,
  TokenTransactionSchema,
} from "src/assets/schemas/token-transaction.schema";
import { Token, TokenSchema } from "src/assets/schemas/token.schema";
import {
  Notification,
  NotificationSchema,
} from "src/notification/schema/notification.schema";
import { PaymentsController } from "src/payments/payments.controller";
import { PaymentsService } from "src/payments/payments.service";
import { PaymentRepository } from "src/payments/repositories/payment.repository";
import { Payment, PaymentSchema } from "src/payments/schemas/payment.schema";
import { StripeModule } from "src/stripe/stripe.module";
import { StripeService } from "src/stripe/stripe.service";
import { UserRepository } from "src/users/repositories/user.repository";
import { User, UserSchema } from "src/users/schema/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Token.name, schema: TokenSchema },
      { name: AssetCategory.name, schema: AssetCategorySchema },
      { name: AssetListing.name, schema: AssetListingSchema },
      { name: TokenHistory.name, schema: TokenHistorySchema },
      { name: TokenTransaction.name, schema: TokenTransactionSchema },
      { name: Rewards.name, schema: RewardsSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),

    ConfigModule,
    StripeModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentRepository,
    StripeService,
    UserRepository,
    ConfigService,
    AssetRepository,
    TokenRepository,
    AssetListingRepository,
  ],
})
export class PaymentsModule {}
