import { Body, Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

import { EmailService } from "src/email/email.service";
import { JoinCommunityDetails } from "src/email/interface/join-community.interface";

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern("email_join")
  async joinCommunity(
    @Body() joinCommunityDetails: JoinCommunityDetails,
  ): Promise<string> {
    return this.emailService.joinCommunity(joinCommunityDetails.email);
  }
}
