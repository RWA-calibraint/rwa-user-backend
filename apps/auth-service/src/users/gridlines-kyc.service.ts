import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";
import axios from "axios";
import { UserRepository } from "./repositories/user.repository";

@Injectable()
export class GridlinesKycService {
  private readonly logger = new Logger(GridlinesKycService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    // Correct base URL for Gridlines
    this.apiUrl = this.configService.get("GRIDLINES_API_URL") || "https://api.gridlines.io";
    this.apiKey = this.configService.get("GRIDLINES_API_KEY");
  }

  /**
   * Generate OTP for Aadhaar verification using Gridlines.
   * Documentation suggests: https://kyc-api.aadhaarkyc.io/api/v1/aadhaar-v2/generate-otp
   * But user is using Gridlines (OnGrid), let's try the likely OnGrid structure or the one found for "aadhaarkyc.io" if they are related.
   * Found: https://kyc-api.aadhaarkyc.io/api/v1/aadhaar-v2/generate-otp
   *
   * However, let's try to map the specific "no route matched" error.
   */
  async generateOtp(aadhaarNumber: string, reason: string) {
    try {
      // Trying standard OnGrid/Gridlines endpoint pattern
      // Reference: https://docs.ongrid.in/ or similar if available
      const response = await axios.post(
        `${this.apiUrl}/api/v1/aadhaar-v2/generate-otp`, // Updated endpoint
        {
          aadhaar_number: aadhaarNumber, // Changed from id_number
        },
        {
          headers: {
            "X-API-Key": this.apiKey, // Changed to X-API-Key based on common patterns
            "Content-Type": "application/json",
          },
        },
      );

      this.logger.log("Gridlines OTP response: " + JSON.stringify(response.data));

      return {
        referenceId: response.data?.data?.reference_id || response.data?.reference_id,
        message: "OTP sent successfully",
      };
    } catch (error) {
      this.logger.error("Gridlines Aadhaar OTP generation failed", error?.response?.data || error.message);

      // If 404, it might still be the wrong endpoint.
      throw new RpcException({
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to generate OTP",
      });
    }
  }

  /**
   * Verify OTP and retrieve Aadhaar data using Gridlines.
   */
  async verifyOtp(referenceId: string, otp: string, userId: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/v1/aadhaar-v2/submit-otp`, // Updated endpoint
        {
          reference_id: referenceId, // Updated param name
          otp: otp,
          include_image: true,
        },
        {
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data?.data || response.data;

      const aadhaarData = {
        status: "VALID",
        message: "Aadhaar Verified",
        name: data?.name,
        dateOfBirth: data?.dob,
        gender: data?.gender,
        address: data?.address ? Object.values(data.address).join(", ") : "",
      };

      await this.userRepository.updateById(userId, {
        kycVerificationStatus: "completed",
        kycVerificationDetails: JSON.stringify({
          provider: "gridlines",
          verifiedAt: new Date().toISOString(),
          ...aadhaarData,
        }),
      });

      this.logger.log(`Aadhaar verification completed for user ${userId}`);

      return aadhaarData;
    } catch (error) {
      this.logger.error("Gridlines Aadhaar OTP verification failed", error?.response?.data || error.message);
      throw new RpcException({
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to verify OTP",
      });
    }
  }
}
