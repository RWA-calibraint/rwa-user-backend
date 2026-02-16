import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

import { firstValueFrom } from "rxjs";

import { multerConfig } from "src/config/multer.config";
import { MICRO_SERVICES } from "src/shared-kernel/constants/microservice-services-context";
import { SkipAuth } from "src/shared-kernel/custom-decorators/skip-auth.decorator";
import { S3Service } from "src/shared-kernel/service/S3/s3.service";
import {
  constructErrorResponse,
  constructSuccessResponse,
} from "src/utils/helper";

import { KycDto } from "./dto/kyc.dto";
import { AadhaarGenerateOtpDto } from "./dto/aadhaar-generate-otp.dto";
import { AadhaarVerifyOtpDto } from "./dto/aadhaar-verify-otp.dto";

@Controller("api/user")
export class UserController {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
    private readonly s3Service: S3Service,
  ) {}

  @Get("detail")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fetch user details" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async fetchUserDetails(@Req() request) {
    try {
      const userId = request?.user?.result?._id;
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

  @Post("update")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update user details" })
  @UseInterceptors(FileInterceptor("file", multerConfig))
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async updateUserDetails(
    @Req() request,
    @Body() updatedData,
    @UploadedFile() profilePic: Express.Multer.File,
  ) {
    try {
      const user = request?.user?.result;

      if (!user?._id) {
        throw new BadRequestException({
          message: "User not found",
        });
      }

      if (profilePic) {
        const s3PathResponse = await this.s3Service.uploadFile(
          profilePic.path,
          profilePic?.mimetype,
        );
        const temp = JSON.parse(updatedData?.updatedData);
        temp.profilePic = s3PathResponse;
        updatedData.updatedData = JSON.stringify(temp);
      }

      const result = await firstValueFrom(
        this.authClient.send("UPDATE_USER_DETAIL", { user, updatedData }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("wallet/address")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update Wallet details" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async updateWalletAddress(@Req() request, @Body() updatedData) {
    try {
      const user = request?.user?.result;

      if (!user?._id) {
        throw new BadRequestException({
          message: "User not found",
        });
      }

      const result = await firstValueFrom(
        this.authClient.send("UPDATE_WALLET_ADDRESS", { user, updatedData }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
  @Post("sendContactEmail")
  @ApiOperation({ summary: "ContactUs and aboutUs email api" })
  async sendContactEmail(@Body() contactDetails) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("SEND_CONTACT_EMAIL", { contactDetails }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("create/applicant")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Creating an applicant" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async initiateKyc(@Req() request, @Body() kycData: KycDto) {
    try {
      const userId = request?.user?.result?._id;

      if (!userId) {
        throw new BadRequestException({
          message: "User not found",
        });
      }

      const result = await firstValueFrom(
        this.authClient.send("INITIATE_KYC", { userId, kycData }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Get("verification/url/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get verification url" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async getVerificationUrl(@Req() request, @Param("id") applicantId: string) {
    const userId = request?.user?.result?._id;

    if (!userId) {
      throw new BadRequestException({
        message: "User not found",
      });
    }

    const result = await firstValueFrom(
      this.authClient.send("KYCAID_VERIFICATION_URL", { userId, applicantId }),
    );
    return constructSuccessResponse(result);
  }

  @Get("applicant/:applicantId/details")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get kyc documents" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async getApplicantsDetails(
    @Req() request,
    @Param("applicantId") applicantId: string,
  ) {
    const userId = request?.user?.result?._id;

    if (!userId) {
      throw new BadRequestException({
        message: "User not found",
      });
    }

    const result = await firstValueFrom(
      this.authClient.send("KYC_DOCUMENTS", { userId, applicantId }),
    );
    return constructSuccessResponse(result);
  }

  @SkipAuth()
  @Post("callback")
  @ApiOperation({ summary: "Verify KYC Callback Api" })
  async handleCallback(@Body() callbackData: any) {
    try {
      const result = await firstValueFrom(
        this.authClient.send(
          MICRO_SERVICES.AUTH_SERVICE.MESSAGE_EVENT.VERIFY_KYC_CALLBACK,
          { callbackData },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("aadhaar/generate-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate OTP for Aadhaar verification" })
  @ApiResponse({ status: 200, description: "OTP generated successfully" })
  async aadhaarGenerateOtp(
    @Req() request,
    @Body() aadhaarData: AadhaarGenerateOtpDto,
  ) {
    try {
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({ message: "User not found" });
      }

      const result = await firstValueFrom(
        this.authClient.send(
          MICRO_SERVICES.AUTH_SERVICE.MESSAGE_EVENT.AADHAAR_GENERATE_OTP,
          { aadhaarData },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @Post("aadhaar/verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify Aadhaar OTP and retrieve Aadhaar data" })
  @ApiResponse({ status: 200, description: "Aadhaar verified successfully" })
  async aadhaarVerifyOtp(
    @Req() request,
    @Body() verifyData: AadhaarVerifyOtpDto,
  ) {
    try {
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({ message: "User not found" });
      }

      const result = await firstValueFrom(
        this.authClient.send(
          MICRO_SERVICES.AUTH_SERVICE.MESSAGE_EVENT.AADHAAR_VERIFY_OTP,
          { userId, verifyData },
        ),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
