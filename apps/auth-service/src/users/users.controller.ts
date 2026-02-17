import { Body, Controller, Headers, Post } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

import { MESSAGES_EVENTS } from "src/shared-kernel/utils/constants/message-events";

import { KycaidKycService } from "./kycaid-kyc.service";
import { DiditKycService } from "./didit-kyc.service";
import { AadhaarGenerateOtpDto } from "./dto/aadhaar-generate-otp.dto";
import { AadhaarVerifyOtpDto } from "./dto/aadhaar-verify-otp.dto";
import { KycDto } from "./dto/kyc.dto";
import { UsersService } from "./users.service";

@Controller()
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly kycaidKycService: KycaidKycService,
    private readonly diditKycService: DiditKycService,
  ) {}

  @MessagePattern(MESSAGES_EVENTS.GET_USER_DETAIL)
  fetchUserDetail(data: { userId: string }) {
    return this.userService.getUserDetail(data.userId);
  }

  @MessagePattern(MESSAGES_EVENTS.UPDATE_USER_DETAIL)
  updateUserDetail(data: { user; updatedData }) {
    return this.userService.updateUserDetail(data.user, data.updatedData);
  }

  @MessagePattern(MESSAGES_EVENTS.UPDATE_WALLET_ADDRESS)
  updateWalletAddress(data: { user; updatedData }) {
    return this.userService.updateWalletAddress(data.user, data.updatedData);
  }
  @MessagePattern(MESSAGES_EVENTS.SEND_CONTACT_EMAIL)
  sendContactEmail(data: { contactDetails }) {
    return this.userService.sendContactEmail(data.contactDetails);
  }

  @MessagePattern(MESSAGES_EVENTS.INITIATE_KYC)
  createApplicant(data: { userId: string; kycData: KycDto }) {
    return this.userService.createApplicant(data.userId, data.kycData);
  }

  @MessagePattern(MESSAGES_EVENTS.KYCAID_VERIFICATION_URL)
  getVerificationUrl(data: { userId: string; applicantId: string }) {
    return this.userService.getVerificationUrl(data.userId, data.applicantId);
  }

  @MessagePattern(MESSAGES_EVENTS.KYC_DOCUMENTS)
  getApplicantsDetails(data: { userId: string; applicantId: string }) {
    return this.userService.getApplicantsDetails(data.userId, data.applicantId);
  }

  @MessagePattern(MESSAGES_EVENTS.VERIFY_KYC_CALLBACK)
  async kycCallback(data: { callbackData: any }) {
    return this.userService.verificationCallback(data.callbackData);
  }

  @MessagePattern(MESSAGES_EVENTS.AADHAAR_GENERATE_OTP)
  async aadhaarGenerateOtp(data: { aadhaarData: AadhaarGenerateOtpDto }) {
    return this.kycaidKycService.generateOtp(
      data.aadhaarData.aadhaarNumber,
      data.aadhaarData.reason,
    );
  }

  @MessagePattern(MESSAGES_EVENTS.AADHAAR_VERIFY_OTP)
  async aadhaarVerifyOtp(data: {
    userId: string;
    verifyData: AadhaarVerifyOtpDto;
  }) {
    return this.kycaidKycService.verifyOtp(
      String(data.verifyData.referenceId),
      data.verifyData.otp,
      data.userId,
    );
  }

  @MessagePattern(MESSAGES_EVENTS.DIDIT_CREATE_SESSION)
  async diditCreateSession(data: { userId: string }) {
    return this.diditKycService.createSession(data.userId);
  }

  @MessagePattern(MESSAGES_EVENTS.DIDIT_GET_DECISION)
  async diditGetDecision(data: { sessionId: string }) {
    return this.diditKycService.getDecision(data.sessionId);
  }

  @MessagePattern("DIDIT_WEBHOOK")
  async diditWebhook(data: { payload: any; signature: string }) {
    return this.diditKycService.handleWebhook(data.payload, data.signature);
  }

  @Post("didit-webhook")
  async diditWebhookHttp(
    @Body() payload: any,
    @Headers("x-signature") signature: string,
  ) {
    return this.diditKycService.handleWebhook(payload, signature);
  }
}
