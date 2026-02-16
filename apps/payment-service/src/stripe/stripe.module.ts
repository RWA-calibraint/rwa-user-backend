import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { Admin, AdminSchema } from "src/admin/schema/admin.schema";
import { AssetRepository } from "src/assets/repositories/asset.repository";
import { TokenRepository } from "src/assets/repositories/token.repository";
import {
  AssetListing,
  AssetListingSchema,
} from "src/assets/schemas/asset-listing.schema";
import { Asset, AssetSchema } from "src/assets/schemas/asset.schema";
import { Rewards, RewardsSchema } from "src/assets/schemas/rewards.schema";
import {
  TokenTransaction,
  TokenTransactionSchema,
} from "src/assets/schemas/token-transaction.schema";
import { Token, TokenSchema } from "src/assets/schemas/token.schema";
import {
  Notification,
  NotificationSchema,
} from "src/notification/schema/notification.schema";
import { PaymentRepository } from "src/payments/repositories/payment.repository";
import { Payment, PaymentSchema } from "src/payments/schemas/payment.schema";
import { SendGrid } from "src/shared/services/send-grid/send-grid.module";
import { SendGridServices } from "src/shared/services/send-grid/send-grid.service";
import { StripeService } from "src/stripe/stripe.service";
import { UserRepository } from "src/users/repositories/user.repository";
import { User, UserSchema } from "src/users/schema/user.schema";

import { StripeWebhook } from "./webhook/webhook.controller";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: TokenTransaction.name, schema: TokenTransactionSchema },
      { name: AssetListing.name, schema: AssetListingSchema },
      { name: User.name, schema: UserSchema },
      { name: Rewards.name, schema: RewardsSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    SendGrid,
  ],
  providers: [
    StripeService,
    TokenRepository,
    PaymentRepository,
    AssetRepository,
    UserRepository,
    SendGridServices,
  ],
  controllers: [StripeWebhook],
  exports: [StripeService, SendGridServices],
})
export class StripeModule {}
