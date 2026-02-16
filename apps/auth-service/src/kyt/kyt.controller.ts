import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

import { KytService } from "./kyt.service";

@Controller()
export class KytController {
  constructor(private readonly kytService: KytService) {}

  @MessagePattern("VERIFY_CRYPTO")
  async verifyCryptoAddress(data: { walletAddress: string; userId: string }) {
    return this.kytService.verifyCryptoAddress(data.walletAddress, data.userId);
  }

  @MessagePattern("VERIFY_KYT_CALLBACK")
  async kytCallback(data: { callbackData: any }) {
    return this.kytService.verificationCallback(data.callbackData);
  }
}
