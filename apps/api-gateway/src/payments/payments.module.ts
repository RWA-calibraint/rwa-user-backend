import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { PaymentsController } from "src/payments/payments.controller";
import { UsersController } from "src/payments/user.controller";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MICRO_SERVICES.PAYMENT_SERVICE.NAME,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get("PAYMENT_SERVICE_HOST"),
            port: configService.get("PAYMENT_SERVICE_PORT"),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PaymentsController, UsersController],
})
export class PaymentsModule {}
