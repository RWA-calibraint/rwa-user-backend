import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";
import axios from "axios";
import { UserRepository } from "./repositories/user.repository";

@Injectable()
export class KycaidKycService {
  private readonly logger = new Logger(KycaidKycService.name);
  private readonly apiUrl: string;
  private readonly apiToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.apiUrl = this.configService.get("KYCAID_ENDPOINT") || "https://api.kycaid.com";
    const isSandbox = this.configService.get("KYCAID_SANDBOX") === "true";
    this.apiToken = isSandbox
      ? (this.configService.get("KYCAID_SANDBOX_API_TOKEN") || this.configService.get("KYCAID_API_TOKEN"))
      : this.configService.get("KYCAID_API_TOKEN");
  }

  /**
   * Generate OTP for Aadhaar verification using KYCAID.
   */
  async generateOtp(aadhaarNumber: string, reason: string) {
    try {
      this.logger.log(`Generating Aadhaar OTP via KYCAID for number: ${aadhaarNumber.slice(0, 4)}********`);

      const response = await axios.post(
        `${this.apiUrl}/services/in/aadhaar/generate-otp`,
        {
          aadhaar_number: aadhaarNumber,
        },
        {
          headers: {
            Authorization: `Token ${this.apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      this.logger.log("KYCAID OTP response: " + JSON.stringify(response.data));

      // KYCAID returns service_request_id in data
      const serviceRequestId = response.data?.data?.service_request_id || response.data?.service_request_id;

      if (!serviceRequestId) {
        throw new Error("service_request_id not found in KYCAID response");
      }

      return {
        referenceId: serviceRequestId,
        message: "OTP sent successfully",
      };
    } catch (error) {
      this.logger.error("KYCAID Aadhaar OTP generation failed", error?.response?.data || error.message);

      throw new RpcException({
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || error?.response?.data?.error || "Failed to generate OTP via KYCAID",
      });
    }
  }

  /**
   * Verify OTP and retrieve Aadhaar data using KYCAID.
   */
  async verifyOtp(referenceId: string, otp: string, userId: string) {
    try {
      this.logger.log(`Verifying Aadhaar OTP via KYCAID for Request ID: ${referenceId}`);

      const response = await axios.post(
        `${this.apiUrl}/services/in/aadhaar/submit-otp`,
        {
          service_request_id: referenceId,
          otp: otp,
        },
        {
          headers: {
            Authorization: `Token ${this.apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      this.logger.log("KYCAID Verification response: " + JSON.stringify(response.data));

      const data = response.data?.data || response.data;

      const aadhaarData = {
        status: "VALID",
        message: "Aadhaar Verified",
        name: data?.name || data?.full_name,
        dateOfBirth: data?.dob || data?.date_of_birth,
        gender: data?.gender,
        address: data?.address ? (typeof data.address === 'object' ? Object.values(data.address).join(", ") : data.address) : "",
      };

      await this.userRepository.updateById(userId, {
        kycVerificationStatus: "completed",
        kycVerificationDetails: JSON.stringify({
          provider: "kycaid",
          verifiedAt: new Date().toISOString(),
          ...aadhaarData,
        }),
      });

      this.logger.log(`Aadhaar verification completed for user ${userId} via KYCAID`);

      return aadhaarData;
    } catch (error) {
      this.logger.error("KYCAID Aadhaar OTP verification failed", error?.response?.data || error.message);

      throw new RpcException({
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || error?.response?.data?.error || "Failed to verify OTP via KYCAID",
      });
    }
  }
}
