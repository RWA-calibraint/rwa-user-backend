import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SchedulerRegistry } from "@nestjs/schedule";

import { NotificationController } from "src/shared-module/notification/notification.controller";
import {
  Admin,
  AdminSchema,
} from "src/shared-module/notification/schema/admin.schema";
import {
  Notification,
  NotificationSchema,
} from "src/shared-module/notification/schema/notification.schema";

import { NotificationCronService } from "./cron/notification-cron.service";
import { NotificationService } from "./notification.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationCronService, SchedulerRegistry],
  exports: [NotificationService],
})
export class NotificationModule {}
