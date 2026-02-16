import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { AssetsController } from "src/assets/assets.controller";
import { AuthModule } from "src/auth/auth.module";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";
import { RedisService } from "src/shared-kernel/redis-cache/redis.service";
import { S3Service } from "src/shared-kernel/service/S3/s3.service";

import { DocumentController } from "./documents.controller";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MICRO_SERVICES.ASSET_SERVICE.NAME,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get("ASSET_SERVICE_HOST"),
            port: configService.get("ASSET_SERVICE_PORT"),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    AuthModule,
  ],
  controllers: [AssetsController, DocumentController],
  providers: [RedisService, S3Service],
})
export class AssetsModule {}
