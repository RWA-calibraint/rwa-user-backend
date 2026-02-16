import { Module } from "@nestjs/common";

import { SendGridServices } from "src/shared-kernel/utils/services/send-grid/send-grid.service";

@Module({
  providers: [SendGridServices],
  exports: [SendGridServices],
})
export class SendGrid {}
