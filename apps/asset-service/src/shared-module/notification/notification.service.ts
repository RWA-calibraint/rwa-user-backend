import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Model } from "mongoose";

import { Admin } from "src/shared-module/notification/schema/admin.schema";
import { Notification } from "src/shared-module/notification/schema/notification.schema";

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly NotificationModel: Model<Notification>,
    @InjectModel(Admin.name)
    private readonly AdminModel: Model<Admin>,
  ) {}

  async fetchAllNotifications(userId: string) {
    const notifications = await this.NotificationModel.find({
      receiverId: userId,
    })
      .sort({ createdAt: -1 })
      .lean();
    return notifications;
  }

  async markNotificationAsRead(notificationId: string) {
    const result = await this.NotificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );
    return !!result;
  }

  async markAllNotificationsAsRead(userId: string) {
    const result = await this.NotificationModel.updateMany(
      { receiverId: userId },
      { $set: { isRead: true } },
    );
    return result.modifiedCount > 0;
  }

  async notifyAdmin(notificationDto) {
    const admins = await this.AdminModel.find({}, "_id");
    const notification = admins.map((admin) => ({
      receiverId: admin._id,
      message: notificationDto.message,
      url: notificationDto?.url,
    }));

    try {
      const result = await this.NotificationModel.insertMany(notification, {
        ordered: false,
      });
      return result;
    } catch (error) {
      if (error.writeErrors) {
        const totalSent = error.result?.result?.nInserted || 0;
        const totalSkipped = error.writeErrors.length;
        return {
          success: true,
          message: `Notifications sent: ${totalSent}, Skipped: ${totalSkipped}`,
        };
      }
      throw error;
    }
  }
}
