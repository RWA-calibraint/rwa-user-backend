import { Controller } from "@nestjs/common";
import { MessagePattern, RpcException } from "@nestjs/microservices";

import { MESSAGES_EVENTS } from "src/shared-kernel/constants/message_events";
import { NotificationService } from "src/shared-module/notification/notification.service";

@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(MESSAGES_EVENTS.FETCH_ALL_NOTIFICATIONS)
  async fetchAllNotifications(data: { userId: string }) {
    try {
      return this.notificationService.fetchAllNotifications(data.userId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.READ_NOTIFICATION)
  async markNotificationAsRead(data: { notificationId: string }) {
    try {
      return this.notificationService.markNotificationAsRead(
        data.notificationId,
      );
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }

  @MessagePattern(MESSAGES_EVENTS.READ_ALL_NOTIFICATIONS)
  async markAllNotificationAsRead(data: { userId: string }) {
    try {
      return this.notificationService.markAllNotificationsAsRead(data.userId);
    } catch (error) {
      throw new RpcException({
        status: error?.$response?.statusCode,
        message: error.message,
      });
    }
  }
}
