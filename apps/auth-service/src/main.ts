import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { AppModule } from "src/app.module";
import { ExceptionFilter } from "src/filter/exception.filter";
import { CustomLoggerService } from "src/shared-kernel/utils/services/custom-logger/custom-logger.service";

async function bootstrap() {
  const logger = new CustomLoggerService("Main");

  const microServicePort = Number(process.env.AUTH_MICROSERVICE_PORT) || 3001;
  const httpPort = Number(process.env.AUTH_SERVICE_HTTP_PORT) || 4001;

  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ExceptionFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST,
      port: microServicePort,
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
  logger.log(`Auth http service is running on port ${httpPort}`);
  logger.log(`Auth microservice is running on port ${microServicePort}`);
}

bootstrap();
