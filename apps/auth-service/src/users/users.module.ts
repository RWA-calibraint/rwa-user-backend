import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { SendGridServices } from "src/shared-kernel/utils/services/send-grid/send-grid.service";
import { User, UserSchema } from "src/users/schema/user.schema";
import { UsersController } from "src/users/users.controller";
import { UsersService } from "src/users/users.service";

import { AadhaarKycService } from "./aadhaar-kyc.service";
import { GridlinesKycService } from "./gridlines-kyc.service";
import { KycaidKycService } from "./kycaid-kyc.service";
import { DiditKycService } from "./didit-kyc.service";
import { UserRepository } from "./repositories/user.repository";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AadhaarKycService, GridlinesKycService, KycaidKycService, DiditKycService, UserRepository, SendGridServices],
  exports: [UsersService, AadhaarKycService, GridlinesKycService, KycaidKycService, DiditKycService, SendGridServices],
})
export class UsersModule {}
