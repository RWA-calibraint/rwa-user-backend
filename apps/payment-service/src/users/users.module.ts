import { Module } from "@nestjs/common";
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
import { StripeModule } from "src/stripe/stripe.module";
import { StripeService } from "src/stripe/stripe.service";
import { UserRepository } from "src/users/repositories/user.repository";
import { User, UserSchema } from "src/users/schema/user.schema";
import { UsersController } from "src/users/users.controller";
import { UsersService } from "src/users/users.service";

@Module({
  imports: [
    StripeModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: TokenTransaction.name, schema: TokenTransactionSchema },
      { name: AssetListing.name, schema: AssetListingSchema },
      { name: Rewards.name, schema: RewardsSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    StripeService,
    UsersService,
    UserRepository,
    PaymentRepository,
    TokenRepository,
    AssetRepository,
  ],
})
export class UsersModule {}
