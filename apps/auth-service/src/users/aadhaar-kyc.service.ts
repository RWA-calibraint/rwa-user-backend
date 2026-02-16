import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";

import axios from "axios";

import { UserRepository } from "./repositories/user.repository";

@Injectable()
export class AadhaarKycService {
  private readonly logger = new Logger(AadhaarKycService.name);
  private readonly sandboxApiUrl: string;
  private readonly sandboxApiKey: string;
  private readonly sandboxApiSecret: string;
  private readonly sandboxApiVersion: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.sandboxApiUrl = this.configService.get("SANDBOX_API_URL");
    this.sandboxApiKey = this.configService.get("SANDBOX_API_KEY");
    this.sandboxApiSecret = this.configService.get("SANDBOX_API_SECRET");
    this.sandboxApiVersion = this.configService.get("SANDBOX_API_VERSION") || "2.0";
  }

  /**
   * Authenticate with Sandbox.co.in and cache the JWT token.
   */
  private async authenticate(): Promise<string> {
    const now = Date.now();

    if (this.cachedToken && now < this.tokenExpiry) {
      return this.cachedToken;
    }

    try {
      const response = await axios.post(
        `${this.sandboxApiUrl}/authenticate`,
        {},
        {
          headers: {
            "x-api-key": this.sandboxApiKey,
            "x-api-secret": this.sandboxApiSecret,
            "x-api-version": this.sandboxApiVersion,
          },
        },
      );

      const token = response.data?.access_token;
      if (!token) {
        throw new Error("No access_token in Sandbox auth response");
      }

      this.cachedToken = token;
      // Cache for 23 hours (Sandbox tokens typically last 24h)
      this.tokenExpiry = now + 23 * 60 * 60 * 1000;
      this.logger.log("Sandbox.co.in JWT token obtained successfully");

      return token;
    } catch (error) {
      this.logger.error("Sandbox authentication failed", error?.response?.data || error.message);
      throw new RpcException({
        status: 500,
        message: "Failed to authenticate with KYC provider",
      });
    }
  }

  /**
   * Generate OTP for Aadhaar verification.
   */
  async generateOtp(aadhaarNumber: string, reason: string) {
    try {
      const token = await this.authenticate();

      const response = await axios.post(
        `${this.sandboxApiUrl}/kyc/aadhaar/okyc/otp`,
        {
          "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
          aadhaar_number: aadhaarNumber,
          consent: "y",
          reason: reason,
        },
        {
          headers: {
            Authorization: token,
            "x-api-key": this.sandboxApiKey,
            "x-api-version": this.sandboxApiVersion,
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data?.data;
      this.logger.log("Sandbox OTP response data: " + JSON.stringify(response.data));
      return {
        referenceId: String(data?.reference_id),
        message: data?.message || "OTP sent successfully",
      };
    } catch (error) {
      this.logger.error("Aadhaar OTP generation failed", error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.data?.message || error?.response?.data?.message || "Failed to generate OTP";
      throw new RpcException({
        status: error?.response?.status || 500,
        message: errorMsg,
      });
    }
  }

  /**
   * Verify OTP and retrieve Aadhaar data. Updates user record on success.
   */
  async verifyOtp(referenceId: string, otp: string, userId: string) {
    try {
      const token = await this.authenticate();

      const response = await axios.post(
        `${this.sandboxApiUrl}/kyc/aadhaar/okyc/otp/verify`,
        {
          "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
          reference_id: referenceId,
          otp: otp,
        },
        {
          headers: {
            Authorization: token,
            "x-api-key": this.sandboxApiKey,
            "x-api-version": this.sandboxApiVersion,
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data?.data;
      const aadhaarData = {
        status: data?.status || "VALID",
        message: data?.message || "Aadhaar Card Exists",
        name: data?.name || "",
        dateOfBirth: data?.date_of_birth || "",
        gender: data?.gender || "",
        address: [
          data?.care_of,
          data?.address?.loc,
          data?.address?.dist,
          data?.address?.state,
          data?.address?.country,
          data?.address?.pc,
        ]
          .filter(Boolean)
          .join(", "),
      };

      await this.userRepository.updateById(userId, {
        kycVerificationStatus: "completed",
        kycVerificationDetails: JSON.stringify({
          provider: "sandbox_aadhaar",
          verifiedAt: new Date().toISOString(),
          ...aadhaarData,
        }),
      });

      this.logger.log(`Aadhaar verification completed for user ${userId}`);

      return aadhaarData;
    } catch (error) {
      this.logger.error("Aadhaar OTP verification failed", error?.response?.data || error.message);
      const errorMsg = error?.response?.data?.data?.message || error?.response?.data?.message || "Failed to verify OTP";
      throw new RpcException({
        status: error?.response?.status || 500,
        message: errorMsg,
      });
    }
  }
}
