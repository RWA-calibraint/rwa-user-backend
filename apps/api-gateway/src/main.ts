import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { AppModule } from "src/app.module";
import { CustomLoggerService } from "src/shared-kernel/custom-logger/custom-logger.service";

async function bootstrap() {
  const logger = new CustomLoggerService();
  const app = await NestFactory.create(AppModule, {
    logger,
  });
  // Enable CORS
  // TODO: Need to update this to restrict the domains
  app.enableCors({
    origin: process.env.FRONTEND_URL.split(",") ?? [],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  });

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // limit each IP to 500 requests per windowMs
    }),
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Rare agora Platform API")
    .setDescription("Rare agora Platform API Documentation")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/docs", app, document);

  // Start the server
  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port);
  logger.log(`API Gateway is running on port ${port}`);
}

bootstrap();
