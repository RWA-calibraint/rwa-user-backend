import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { EmailController } from "src/email/email.controller";
import { EmailService } from "src/email/email.service";
import { EmailRepository } from "src/email/repository/email.repository";
import { Email, EmailSchema } from "src/email/schema/email.schema";
import { SendGridServices } from "src/shared-kernel/utils/services/send-grid/send-grid.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]),
  ],
  controllers: [EmailController],
  providers: [EmailService, SendGridServices, EmailRepository],
})
export class EmailModule {}
