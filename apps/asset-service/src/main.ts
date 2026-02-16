import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { AppModule } from "src/app.module";
import { CustomLoggerService } from "src/shared-kernel/custom-logger/custom-logger.service";

import { ExceptionFilter } from "./filter/exception.filter";

async function bootstrap() {
  const logger = new CustomLoggerService();

  const microServicePort = Number(process.env.ASSET_MICROSERVICE_PORT) || 3002;
  const httpPort = Number(process.env.ASSET_HTTP_PORT) || 4002;
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ExceptionFilter());
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: microServicePort,
      host: process.env.ASSET_SERVICE_HOST,
    },
  });
  app.enableCors({
    origin: ["*"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  });
  await app.startAllMicroservices();
  await app.listen(httpPort);
  logger.log(`Asset http service is running on port ${httpPort}`);
  logger.log(`Asset microservice is running on port ${microServicePort}`);
}

bootstrap();
