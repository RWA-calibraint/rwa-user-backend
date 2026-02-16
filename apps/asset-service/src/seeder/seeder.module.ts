import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import {
  AssetCategory,
  AssetCategorySchema,
} from "../assets/schemas/category.schema";
import databaseConfig from "../config/database.config";
import { CustomLoggerService } from "../shared-kernel/custom-logger/custom-logger.service";

import { AssetCategorySeeder } from "./category.seed";

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
    MongooseModule.forFeature([
      { name: AssetCategory.name, schema: AssetCategorySchema },
    ]),
  ],
  providers: [AssetCategorySeeder],
  exports: [AssetCategorySeeder],
})
export class SeederModule {}
