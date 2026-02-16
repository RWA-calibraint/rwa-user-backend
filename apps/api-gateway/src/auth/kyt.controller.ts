import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Req,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

import { firstValueFrom } from "rxjs";

import { ERROR_MESSAGES } from "src/shared-kernel/constants/error-message";
import { SkipAuth } from "src/shared-kernel/custom-decorators/skip-auth.decorator";
import {
  constructErrorResponse,
  constructSuccessResponse,
} from "src/utils/helper";

@Controller("kyt")
export class KytController {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
  ) {}

  @Post("verify-crypto-address")
  @ApiOperation({ summary: "Verify crypto address" })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async verifyCryptoAddress(
    @Req() request,
    @Body() body: { walletAddress: string },
  ) {
    try {
      const userId = request?.user?.result?._id;
      if (!userId) {
        throw new BadRequestException({
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }
      const { walletAddress } = body;
      const result = await firstValueFrom(
        this.authClient.send("VERIFY_CRYPTO", { userId, walletAddress }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }

  @SkipAuth()
  @Post("callback")
  @ApiOperation({ summary: "Verify KYT Callback Api" })
  async handleCallback(@Body() callbackData: any) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("VERIFY_KYT_CALLBACK", { callbackData }),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      return constructErrorResponse(error);
    }
  }
}
