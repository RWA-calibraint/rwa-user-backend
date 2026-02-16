import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";

import axios from "axios";
import { Model } from "mongoose";

import { UserRepository } from "src/users/repositories/user.repository";

import { KytVerification } from "./schema/kyt-verification.schema";

@Injectable()
export class KytService {
  private readonly apiUrl = "https://api.kycaid.com";
  private readonly apiToken: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(KytVerification.name)
    private readonly kycaidVerificationModel: Model<KytVerification>,
    private readonly userRepository: UserRepository,
  ) {
    this.apiToken = this.configService.get("KYT_API_TOKEN");
    this.callbackUrl = this.configService.get("KYT_CALLBACK_URL");
    if (!this.apiToken) {
      throw new Error(
        "KYCAID_API_TOKEN is not defined in environment variables",
      );
    }
  }

  async verifyCryptoAddress(hash: string, userId: string): Promise<any> {
    try {
      const asset = "ETH";
      const response = await axios
        .post(
          `${this.apiUrl}/services/crypto/address-verification`,
          { hash, asset, callback_url: this.callbackUrl },
          {
            headers: {
              Authorization: `Token ${this.apiToken}`,
              "Content-Type": "application/json",
            },
          },
        )
        .then((response) => response.data);

      if (!response.data.service_request_id) {
        throw new HttpException(
          "Invalid KYCAID response: missing service_request_id",
          400,
        );
      }
      await this.userRepository.updateById(userId, {
        kytServiceRequest: response.data.service_request_id,
      });
      const verification = new this.kycaidVerificationModel({
        userId,
        serviceRequestId: response.data.service_request_id,
        walletAddress: hash,
        requestStatus: response.data.requestStatus || "pending",
        asset,
        serviceRequestType: "CRYPTO_ADDRESS_CHECK",
      });
      await verification.save();
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.error || "Failed to verify crypto address",
        error.response?.status || 500,
      );
    }
  }

  async verificationCallback(callbackData: any): Promise<void> {
    try {
      Logger.log("Executing KYT webhook");
      const {
        type,
        service_request_id,
        service_request_type,
        service_request_status,
        result,
        errors,
      } = callbackData;

      if (type !== "SERVICE_RESULT") {
        throw new HttpException("Invalid callback type", 400);
      }

      if (
        !service_request_id ||
        !service_request_type ||
        !service_request_status
      ) {
        throw new HttpException(
          "Missing required callback fields: service_request_id, service_request_type, or service_request_status",
          400,
        );
      }

      let verification = await this.kycaidVerificationModel.findOne({
        serviceRequestId: service_request_id,
      });

      if (!verification) {
        if (!result?.address || !result?.asset) {
          throw new HttpException(
            "Cannot create new verification: missing address or asset in result",
            400,
          );
        }
        verification = new this.kycaidVerificationModel({
          serviceRequestId: service_request_id,
          walletAddress: result.address,
          asset: result.asset,
          serviceRequestType: service_request_type,
        });
      }

      verification.requestStatus = service_request_status;
      verification.serviceRequestType = service_request_type;
      verification.result = result || null;
      verification.riskLevel = this.calculateRiskLevel(result);

      if (result) {
        verification.network = result.network;
        verification.pdfReport = result.pdf_report;
        verification.uid = result.uid;
        verification.memo = result.memo;
        verification.fiatCodeEffective = result.fiat_code_effective;
        verification.blackListsConnections = result.black_lists_connections;
        verification.hasBlackListFlag = result.has_black_list_flag;
      }

      if (errors && errors.length > 0) {
        verification.requestStatus = "error";
        verification.result = { errors };
      }

      await verification.save();
    } catch (error) {
      throw new HttpException(
        `Failed to process callback: ${error.message}`,
        400,
      );
    }
  }

  private calculateRiskLevel(result: any): string {
    if (!result) return "Unknown";

    const { riskscore, signals, black_lists_connections, has_black_list_flag } =
      result;

    if (riskscore !== undefined) {
      if (riskscore >= 60) return "High";
      if (riskscore >= 30) return "Moderate";
      return "Low";
    }

    const highRiskSignals = [
      "sanctions",
      "terrorism_financing",
      "scam",
      "ransom",
      "dark_market",
      "dark_service",
      "exchange_fraudulent",
      "illegal_service",
    ];
    const hasHighRisk = signals
      ? highRiskSignals.some((signal) => signals[signal] > 0)
      : false;
    const hasBlackList = black_lists_connections || has_black_list_flag;

    if (hasHighRisk || hasBlackList) return "High";
    if (
      signals?.exchange_mlrisk_high > 0 ||
      signals?.p2p_exchange_mlrisk_high > 0
    )
      return "Moderate";
    return "Low";
  }
}
