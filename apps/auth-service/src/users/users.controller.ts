import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

import { MESSAGES_EVENTS } from "src/shared-kernel/utils/constants/message-events";

import { AadhaarKycService } from "./aadhaar-kyc.service";
import { GridlinesKycService } from "./gridlines-kyc.service";
import { AadhaarGenerateOtpDto } from "./dto/aadhaar-generate-otp.dto";
import { AadhaarVerifyOtpDto } from "./dto/aadhaar-verify-otp.dto";
import { KycDto } from "./dto/kyc.dto";
import { UsersService } from "./users.service";

@Controller()
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly aadhaarKycService: AadhaarKycService,
    private readonly gridlinesKycService: GridlinesKycService,
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
    return this.aadhaarKycService.generateOtp(
      data.aadhaarData.aadhaarNumber,
      data.aadhaarData.reason,
    );
  }

  @MessagePattern(MESSAGES_EVENTS.AADHAAR_VERIFY_OTP)
  async aadhaarVerifyOtp(data: {
    userId: string;
    verifyData: AadhaarVerifyOtpDto;
  }) {
    return this.aadhaarKycService.verifyOtp(
      String(data.verifyData.referenceId),
      data.verifyData.otp,
      data.userId,
    );
  }
}
