import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { AppModule } from "src/app.module";
import { CustomLoggerService } from "src/shared-kernel/utils/services/custom-logger/custom-logger.service";

async function bootstrap() {
  const logger = new CustomLoggerService("Main");

  const microServicePort =
    Number(process.env.PAYMENT_MICROSERVICE_PORT) || 3003;
  const httpPort = Number(process.env.PAYMENT_HTTP_PORT) || 4003;

  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.PAYMENT_SERVICE_HOST,
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
  logger.log(`Payment http service is running on port ${httpPort}`);
  logger.log(`Payment microservice is running on port ${microServicePort}`);
}

bootstrap();
