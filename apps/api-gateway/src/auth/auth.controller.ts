import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseInterceptors,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Response } from "express";
import { firstValueFrom } from "rxjs";

import {
  ConfirmForgotPasswordDto,
  ConfirmSignupDto,
  ForgotPasswordDto,
  SigninDto,
  SignupDto,
} from "src/auth/dto";
import { LoginInterceptor } from "src/auth/interceptor/login.interceptor";
import { SkipAuth } from "src/shared-kernel/custom-decorators/skip-auth.decorator";
import { EmailValidationDto } from "src/shared-kernel/dto/email-validation.dto";
import {
  constructErrorResponse,
  constructSuccessResponse,
} from "src/utils/helper";

@ApiTags("Authentications")
@SkipAuth()
@Controller("auth")
export class AuthController {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
  ) {}

  @Get("social-signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Social Signin" })
  @ApiBody({ type: SigninDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async socialSignin() {
    try {
      const result = await firstValueFrom(
        this.authClient.send("auth.socialSignin", {}),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("confirm-social-signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm Social Signin" })
  @ApiBody({ type: SigninDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async confirmSocialSignin(@Query("code") code: string) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("auth.confirmSocialSignin", { code }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("signup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sign up a new user" })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  async createUser(@Body() signupDetails: SignupDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("auth.signup", signupDetails),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("confirm-signup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm user signup" })
  @ApiBody({ type: ConfirmSignupDto })
  @ApiResponse({ status: 200, description: "OK", type: String })
  async confirmSignup(@Body() confirmSignupDetails: ConfirmSignupDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("auth.confirmSignup", confirmSignupDetails),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User Signin",
    description: "User logs into their account. ",
  })
  @ApiBody({
    type: SigninDto,
  })
  @ApiResponse({
    status: 200,
    description: "OK",
  })
  @ApiResponse({
    status: 403,
    description: "User is not confirmed.",
    content: {
      "application/json": {
        example: {
          statusCode: 403,
          message: "User is not confirmed.",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Validation Error",
    content: {
      "application/json": {
        example: {
          message: ["Password is required"],
          error: "Bad Request",
          statusCode: 400,
        },
      },
    },
  })
  @UseInterceptors(LoginInterceptor)
  async signin(@Body() signinDetails: SigninDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("auth.signin", signinDetails),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async forgotPassword(@Body() forgotPasswordDetails: ForgotPasswordDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("auth.forgotPassword", forgotPasswordDetails),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("confirm-forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm password reset" })
  @ApiBody({ type: ConfirmForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async confirmForgotPassword(
    @Body() confirmForgotPasswordDetails: ConfirmForgotPasswordDto,
  ) {
    try {
      const result = await firstValueFrom(
        this.authClient.send(
          "auth.confirmForgotPassword",
          confirmForgotPasswordDetails,
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("resend/confirmation-code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend the confirmation code" })
  @ApiBody({ type: EmailValidationDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async resendConfirmationCode(@Body() { email }: EmailValidationDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("auth.resendConfirmationCode", { email }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("user/detail")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fetch user details" })
  @ApiBody({ type: EmailValidationDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async fetchUserDetails(@Req() request) {
    try {
      const userId = request?.user?.userDetails?.result?._id;
      if (!userId) {
        throw new BadRequestException({
          message: "User not found",
        });
      }
      const result = await firstValueFrom(
        this.authClient.send("GET_USER_DETAIL", { userId }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async logoutUser(@Res({ passthrough: true }) response: Response) {
    try {
      response.clearCookie("user-access-token", {
        httpOnly: true,
        secure: true,
        domain: ".rareagora.com",
        sameSite: "none",
      });
      const result = "Logged out successfully";
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
