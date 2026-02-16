import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthController } from "src/auth/auth.controller";
import { AuthService } from "src/auth/auth.service";
import { CognitoService } from "src/shared-kernel/utils/services/aws/cognito.service";
import { UserRepository } from "src/users/repositories/user.repository";
import { User, UserSchema } from "src/users/schema/user.schema";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, CognitoService],
})
export class AuthModule {}
