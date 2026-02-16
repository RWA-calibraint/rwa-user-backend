import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { EscrowController } from "src/escrow/escrow.controller";
import { EscrowService } from "src/escrow/escrow.service";
import { EscrowWebhookHandler } from "src/escrow/escrow.webhook";
import { Escrow, EscrowSchema } from "src/escrow/schemas/escrow.schema";
import { PaymentsModule } from "src/payments/payments.module";
import { StripeModule } from "src/stripe/stripe.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Escrow.name, schema: EscrowSchema }]),
    ConfigModule,
    PaymentsModule,
    StripeModule,
  ],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowWebhookHandler],
  exports: [EscrowService],
})
export class EscrowModule {}
