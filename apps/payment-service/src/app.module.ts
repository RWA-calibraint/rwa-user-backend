import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "src/app.controller";
import { EtherModule } from "src/blockchain/ethers/ether.module";
import { EscrowModule } from "src/escrow/escrow.module";
import { PaymentsModule } from "src/payments/payments.module";
import { CustomLoggerService } from "src/shared-kernel/utils/services/custom-logger/custom-logger.service";
import { StripeModule } from "src/stripe/stripe.module";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
        logger = new CustomLoggerService("App"),
      ) => ({
        uri: configService.get<string>("MONGODB_URI"),
        dbName: configService.get<string>("MONGODB_DATABASE"),
        replicaSet: configService.get<string>("MONGODB_REPLICA_SET"),
        w: "majority",
        wtimeoutMS: 10000,
        retryWrites: true,
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
    PaymentsModule,
    EscrowModule,
    StripeModule,
    UsersModule,
    EtherModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
