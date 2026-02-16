import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { UserRepository } from "src/users/repositories/user.repository";
import { User, UserSchema } from "src/users/schema/user.schema";

import { KytController } from "./kyt.controller";
import { KytService } from "./kyt.service";
import {
  KytVerification,
  KytVerificationSchema,
} from "./schema/kyt-verification.schema";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: KytVerification.name, schema: KytVerificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [KytController],
  providers: [KytService, UserRepository],
})
export class KytModule {}
