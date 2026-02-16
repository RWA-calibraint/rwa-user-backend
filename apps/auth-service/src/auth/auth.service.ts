import { pbkdf2Sync } from "crypto";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";

import * as jwt from "jsonwebtoken";
import * as generateUniqueId from "ultra-unique-id";
import { v4 as uuidv4 } from "uuid";

import {
  ConfirmForgotPasswordInterface,
  ConfirmSignupInterface,
  ForgotPasswordInterface,
  SigninInterface,
  SigninResponse,
  SignupInterface,
} from "src/auth/interface/index";
import { ERROR_MESSAGES } from "src/shared-kernel/utils/constants/exceptions/error-message";
import { USER_STATUS } from "src/shared-kernel/utils/constants/user-enums";
import { CognitoService } from "src/shared-kernel/utils/services/aws/cognito.service";
import { UserRepository } from "src/users/repositories/user.repository";
import { User } from "src/users/schema/user.schema";

import { SocialSigninResponse } from "./interface/authentication.interface";
@Injectable()
export class AuthService {
  constructor(
    private readonly cognitoService: CognitoService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(accessToken: string): Promise<any> {
    try {
      const result = await this.cognitoService.getUser(accessToken);
      const userDetails = await this.userRepository.findByCognitoId(
        result.username,
      );
      this.validateUserDetails(userDetails);
      return { isValid: true, result: userDetails };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async validateOauthUser(decodedToken): Promise<any> {
    try {
      const email = decodedToken?.email;
      if (!email) throw new UnauthorizedException("Invalid token");
      const userDetails = await this.userRepository.find(email);
      return { isValid: true, result: userDetails };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async socialSignin(): Promise<SocialSigninResponse> {
    try {
      const url = await this.cognitoService.socialSignin();
      return { url };
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async confirmSocialSignin(code: string): Promise<any> {
    try {
      const result = await this.cognitoService.confirmSocialSignin(code);
      const { id_token } = result;

      const decoded = JSON.parse(
        Buffer.from(id_token.split(".")[1], "base64").toString(),
      );

      const email = decoded.email;
      const cognitoSubId = decoded["sub"];

      let user = await this.userRepository.findByCognitoId(cognitoSubId);

      if (!user) {
        user = await this.userRepository.create({
          email,
          cognitoSubId,
          firstName: decoded.given_name || "Guest",
          lastName: decoded.family_name || "User",
          userId: generateUniqueId(6),
          password: "*",
        });
      }
      const token = jwt.sign(
        {
          userId: user.userId,
          email: user.email,
          auth: "google",
        },
        process.env.Jwt_SECRET_KEY,
        { expiresIn: "1h" },
      );
      return {
        accessToken: token,
      };
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async createUser(signupDetails: SignupInterface): Promise<string> {
    try {
      const { UserSub: cognitoSubId } =
        await this.cognitoService.signup({...signupDetails, userName: uuidv4()});
        console.log('==> Cognito Signup Result:', cognitoSubId);
      const userDbData: User = {  
        email: signupDetails.email,
        password: signupDetails.password,
        cognitoSubId,
        userId: generateUniqueId(6),
        firstName: signupDetails.firstName,
        lastName: signupDetails.lastName,
      };
      await this.userRepository.create(userDbData);
      return "OK";
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async confirmSignup(
    confirmSignupDetails: ConfirmSignupInterface,
  ): Promise<string> {
    try {
      await this.cognitoService.confirmSignup(
        confirmSignupDetails.email,
        confirmSignupDetails.confirmationCode,
      );
      const user = await this.userRepository.find(confirmSignupDetails.email);

      if (!user) {
        throw new Error(ERROR_MESSAGES.RESPONSES.USER.NOT_FOUND);
      }

      await this.userRepository.updateById(user._id.toString(), {
        isVerified: true,
      });
      return "OK";
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async signin(signinDetails: SigninInterface): Promise<SigninResponse> {
    try {
      const userDetails = await this.userRepository.find(signinDetails.email);
      this.validateUserDetails(userDetails);
      const {
        AuthenticationResult: { AccessToken },
      } = await this.cognitoService.signin(signinDetails);
      await this.userRepository.updateById(userDetails._id.toString(), {
        lastActive: new Date(),
      });
      return { accessToken: AccessToken };
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async forgotPassword({ email }: ForgotPasswordInterface): Promise<string> {
    try {
      const userDetails = await this.userRepository.find(email);
      this.validateUserDetails(userDetails);
      await this.cognitoService.forgotPassword(email);
      return "OK";
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async confirmForgotPassword(
    confirmForgotPasswordDetails: ConfirmForgotPasswordInterface,
  ): Promise<string> {
    try {
      await this.cognitoService.confirmForgotPassword(
        confirmForgotPasswordDetails,
      );
      const { cognitoSubId } = await this.userRepository.find(
        confirmForgotPasswordDetails.email,
      );
      const userUpdateData = {
        email: confirmForgotPasswordDetails.email,
        password: confirmForgotPasswordDetails.password,
        cognitoSubId: cognitoSubId,
      };
      await this.userRepository.update(userUpdateData);
      return "OK";
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  async resendConfirmationCode(email: string) {
    try {
      await this.cognitoService.resendConfirmationCode(email);
      return "OK";
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  private validateUserDetails(userDetails: User | null) {
    if (!userDetails) {
      throw new Error(ERROR_MESSAGES.RESPONSES.USER.NOT_FOUND);
    }
    if (userDetails.status !== USER_STATUS.ACTIVE)
      throw new Error(
        ERROR_MESSAGES.RESPONSES.USER.INACTIVE_USER(userDetails.status),
      );
  }

  private generatePasswordHash(userEmail: string, password: string): string {
    return pbkdf2Sync(
      `${userEmail}${password}`,
      this.configService.get("CRYPTO_SALT"),
      1000,
      64,
      `sha512`,
    ).toString(`hex`);
  }
}
