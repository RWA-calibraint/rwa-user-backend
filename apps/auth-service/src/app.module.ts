import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "src/app.controller";
import { AuthModule } from "src/auth/auth.module";
import { EmailModule } from "src/email/email.module";
import { AwsSdkModule } from "src/shared-kernel/utils/services/aws/aws.module";
import { CustomLoggerService } from "src/shared-kernel/utils/services/custom-logger/custom-logger.service";
import { UsersModule } from "src/users/users.module";

import { KytModule } from "./kyt/kyt.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
        logger = new CustomLoggerService("App"),
      ) => ({
        uri: configService.get("MONGODB_URI"),
        dbName: configService.get("MONGODB_DATABASE"),
        replicaSet: configService.get("MONGODB_REPLICA_SET"),
        wtimeoutMS: 5000,
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
    }),
    AuthModule,
    UsersModule,
    AwsSdkModule,
    EmailModule,
    KytModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
