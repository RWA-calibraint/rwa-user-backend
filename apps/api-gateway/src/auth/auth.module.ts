import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { AuthController } from "src/auth/auth.controller";
import { EmailController } from "src/auth/email.controller";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";
import { S3Service } from "src/shared-kernel/service/S3/s3.service";

import { KytController } from "./kyt.controller";
import { UserController } from "./user.controller";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MICRO_SERVICES.AUTH_SERVICE.NAME,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get("AUTH_SERVICE_HOST"),
            port: configService.get("AUTH_SERVICE_PORT") || 3001,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
  controllers: [AuthController, EmailController, UserController, KytController],
  providers: [S3Service],
})
export class AuthModule {}
