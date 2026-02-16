import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { AuthService } from "src/auth/auth.service";
import {
  ConfirmForgotPasswordInterface,
  ConfirmSignupInterface,
  ForgotPasswordInterface,
  SigninInterface,
  SignupInterface,
} from "src/auth/interface/index";

import { ResendConfirmationCode } from "./interface/resend-confirmation-code.interface";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern("validate_token")
  validateToken(data: { token: string }): Promise<any> {
    return this.authService.validateUser(data.token);
  }

  @MessagePattern("validate_oauth_token")
  validateOauthToken(data: { decodedToken: any }): Promise<any> {
    return this.authService.validateOauthUser(data.decodedToken);
  }

  @MessagePattern("auth.socialSignin")
  async socialSignin(@Payload() {}) {
    return this.authService.socialSignin();
  }

  @MessagePattern("auth.confirmSocialSignin")
  async confirmSocialSignin(data: { code: string }): Promise<any> {
    return this.authService.confirmSocialSignin(data.code);
  }

  @MessagePattern("auth.signup")
  async createUser(@Payload() signupDetails: SignupInterface) {
    console.log('==> Signup Details:', signupDetails);
    return this.authService.createUser(signupDetails);
  }

  @MessagePattern("auth.confirmSignup")
  async confirmSignup(@Payload() confirmSignupDetails: ConfirmSignupInterface) {
    return this.authService.confirmSignup(confirmSignupDetails);
  }

  @MessagePattern("auth.signin")
  async signin(@Payload() signinDetails: SigninInterface) {
    return this.authService.signin(signinDetails);
  }

  @MessagePattern("auth.forgotPassword")
  async forgotPassword(
    @Payload() forgotPasswordDetails: ForgotPasswordInterface,
  ) {
    return this.authService.forgotPassword(forgotPasswordDetails);
  }

  @MessagePattern("auth.confirmForgotPassword")
  async confirmForgotPassword(
    @Payload() confirmForgotPasswordDetails: ConfirmForgotPasswordInterface,
  ) {
    return this.authService.confirmForgotPassword(confirmForgotPasswordDetails);
  }

  @MessagePattern("auth.resendConfirmationCode")
  async resendConfirmationCode(@Payload() { email }: ResendConfirmationCode) {
    return this.authService.resendConfirmationCode(email);
  }
}
