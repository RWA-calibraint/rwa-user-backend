import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "src/app.controller";
import { AssetsModule } from "src/assets/assets.module";
import databaseConfig from "src/config/database.config";
import { DocumentsModule } from "src/documents/documents.module";
import { CustomLoggerService } from "src/shared-kernel/custom-logger/custom-logger.service";

import { NotificationModule } from "./shared-module/notification/notification.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
        logger = new CustomLoggerService(),
      ) => ({
        uri: configService.get<string>("database.uri"),
        dbName: configService.get<string>("database.database"),
        replicaSet: configService.get<string>("database.replicaSet"),
        w: configService.get<"majority" | number>("database.writeConcern.w"),
        wtimeoutMs: configService.get<number>("database.writeConcern.wtimeout"),
        retryWrites: configService.get<boolean>("database.retryWrites"),
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        monitorCommands: true,
        connectionFactory: (connection) => {
          connection.on("connected", () => {
            logger.log("MongoDB connected successfully");
          });
          connection.on("disconnected", () => {
            logger.log("MongoDB disconnected");
          });
          connection.on("error", (error) => {
            logger.error("MongoDB connection error:", error);
          });
          connection.on("commandStarted", (event) => {
            logger.log("MongoDB command started:", event.commandName);
          });
          connection.on("commandSucceeded", (event) => {
            logger.log("MongoDB command succeeded:", event.commandName);
          });
          connection.on("commandFailed", (event) => {
            logger.error("MongoDB command failed:", event.commandName);
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    AssetsModule,
    DocumentsModule,
    NotificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
