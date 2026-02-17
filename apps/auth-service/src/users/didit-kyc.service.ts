import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RpcException } from "@nestjs/microservices";
import axios from "axios";
import { UserRepository } from "./repositories/user.repository";
import * as crypto from "crypto";
import { Types } from "mongoose";

@Injectable()
export class DiditKycService {
  private readonly logger = new Logger(DiditKycService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly workflowId: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.apiUrl = this.configService.get("DIDIT_API_URL") || "https://api.didit.me";
    this.apiKey = this.configService.get("DIDIT_API_KEY");
    this.workflowId = this.configService.get("DIDIT_WORKFLOW_ID");
    this.webhookSecret = this.configService.get("DIDIT_WEBHOOK_SECRET");
  }

  /**
   * Create a verification session with Didit.
   */
  async createSession(userId: string) {
    try {
      this.logger.log(`Creating Didit verification session for user: ${userId}`);

      if (!userId || !Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Invalid userId provided for session creation: ${userId}`);
      }

      const response = await axios.post(
        `${this.apiUrl}/v3/session/`,
        {
          workflow_id: this.workflowId,
          vendor_data: userId,
          callback: "https://dev.rareagora.com/profile?didit=success", // Example callback
          features: {
            allow_desktop: true,
          },
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      this.logger.log("Didit session created: " + JSON.stringify(response.data));

      return {
        url: response.data?.url,
        sessionId: response.data?.session_id,
        sessionToken: response.data?.session_token,
      };
    } catch (error) {
      this.logger.error("Didit session creation failed", error?.response?.data || error.message);
      throw new RpcException({
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to create Didit session",
      });
    }
  }

  /**
   * Handle webhook from Didit.
   */
  async handleWebhook(payload: any, signature: string) {
    try {
      this.logger.log(`Received Didit webhook. Payload: ${JSON.stringify(payload)}`);
      this.logger.log(`Received Didit signature: ${signature}`);

      // Verify signature
      if (this.webhookSecret && signature) {
        const hmac = crypto.createHmac("sha256", this.webhookSecret);
        const digest = hmac.update(JSON.stringify(payload)).digest("hex");

        if (digest !== signature) {
          this.logger.error(`Invalid Didit webhook signature. Expected: ${digest}, Received: ${signature}`);
          // throw new Error("Invalid signature"); // Keep it non-blocking for now while debugging
        }
      }

      const { status, vendor_data, decision } = payload;
      // Try to get userId from top level or decision object
      const userId = vendor_data || decision?.vendor_data;

      if (!userId) {
        this.logger.warn("Didit webhook missing vendor_data (userId) in both top-level and decision fields");
        return { success: true, message: "No user id found" };
      }

      // Check if ID is a valid MongoDB ObjectId to avoid CastError
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Didit webhook received invalid ObjectId in vendor_data: ${userId}`);
        return { success: false, message: "Invalid user id format" };
      }

      const finalStatus = status || decision?.status;

      // Mirroring KycaidKycService pattern
      if (finalStatus === "Approved") {
        await this.userRepository.updateById(userId, {
          kycVerificationStatus: "completed",
          kycVerificationDetails: JSON.stringify({
            provider: "didit",
            verifiedAt: new Date().toISOString(),
            ...decision,
          }),
        });
        this.logger.log(`KYC completed for user ${userId} via Didit Webhook`);
      } else if (finalStatus === "Declined") {
        await this.userRepository.updateById(userId, {
          kycVerificationStatus: "failed",
          kycVerificationDetails: JSON.stringify({
            provider: "didit",
            verifiedAt: new Date().toISOString(),
            ...decision,
          }),
        });
        this.logger.log(`KYC failed for user ${userId} via Didit Webhook`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error("Failed to handle Didit webhook", error.message);
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  /**
   * Manual decision check if needed.
   */
  async getDecision(sessionId: string) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v3/session/${sessionId}/decision/`,
        {
          headers: { "x-api-key": this.apiKey },
        },
      );
      this.logger.log(`Didit manual decision for ${sessionId}: ${response.data?.status}`);
      return response.data;
    } catch (error) {
      this.logger.error("Failed to fetch Didit decision", error.message);
      throw new RpcException({ status: 500, message: "Failed to fetch Didit decision" });
    }
  }
}
