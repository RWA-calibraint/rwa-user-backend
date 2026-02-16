import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Post,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { firstValueFrom } from "rxjs/internal/firstValueFrom";

import { JoinCommunityDto } from "src/auth/dto";
import { SkipAuth } from "src/shared-kernel/custom-decorators/skip-auth.decorator";
import {
  constructFailureResponse,
  constructSuccessResponse,
} from "src/utils/helper";

//TODO: Need to move the string into the constant files
@SkipAuth()
@Controller("email")
export class EmailController {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
  ) {}

  @Post("join")
  @ApiOperation({ summary: "Join the community by providing an email" })
  @ApiBody({ type: JoinCommunityDto })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: String,
  })
  async joinCommunity(@Body() joinCommunityDetails: JoinCommunityDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send("email_join", joinCommunityDetails),
      );
      return constructSuccessResponse(result);
    } catch (error) {
      throw new HttpException(
        constructFailureResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error?.message || "Internal Server Error",
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
