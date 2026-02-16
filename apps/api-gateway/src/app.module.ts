import { Inject, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ClientProxy, ClientsModule } from "@nestjs/microservices";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "src/app.controller";
import { AssetsModule } from "src/assets/assets.module";
import { AuthModule } from "src/auth/auth.module";
import { AuthGuard } from "src/auth/guard/auth.guard";
import databaseConfig from "src/config/database.config";
import { PaymentsModule } from "src/payments/payments.module";
import { CustomLoggerService } from "src/shared-kernel/custom-logger/custom-logger.service";

import { RedisModule } from "./shared-kernel/redis-cache/redis-cache.module";

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
    AuthModule,
    AssetsModule,
    PaymentsModule,
    ClientsModule,
    RedisModule,
  ],
  controllers: [AppController],
  exports: [ClientsModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
  ) {
    this.checkMicroSercviceStatus();
  }

  async checkMicroSercviceStatus() {
    try {
      await this.authClient.connect();
      console.log("Auth service connected successfully");

      // await this.authClient()
      console.log("Auth service ready ");
    } catch (error) {
      console.log("Error in checking the micro service status", error);
    }
  }
}
