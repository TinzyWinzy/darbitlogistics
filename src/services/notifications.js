import { deliveryApi } from './api';

const MILESTONE_THRESHOLDS = {
  STARTED: 0,
  QUARTER: 25,
  HALF: 50,
  THREE_QUARTERS: 75,
  COMPLETED: 100
};

const DEADLINE_WARNINGS = {
  WEEK: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  THREE_DAYS: 3 * 24 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000
};

class NotificationService {
  constructor() {
    this.lastNotifiedProgress = new Map();
    this.lastDeadlineWarning = new Map();
  }

  async checkMilestones(booking) {
    const notifications = [];
    const lastProgress = this.lastNotifiedProgress.get(booking.id) || -1;
    const currentProgress = booking.completion_percentage;

    // Check progress milestones
    for (const [milestone, threshold] of Object.entries(MILESTONE_THRESHOLDS)) {
      if (currentProgress >= threshold && lastProgress < threshold) {
        const message = this.getProgressMessage(milestone, booking);
        notifications.push({
          type: 'PROGRESS',
          message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update last notified progress
    this.lastNotifiedProgress.set(booking.id, currentProgress);

    // Check deadline warnings
    const now = new Date();
    const deadline = new Date(booking.deadline);
    const timeLeft = deadline - now;
    const lastWarning = this.lastDeadlineWarning.get(booking.id);

    if (timeLeft > 0) {
      for (const [warning, threshold] of Object.entries(DEADLINE_WARNINGS)) {
        if (timeLeft <= threshold && (!lastWarning || lastWarning > threshold)) {
          const message = this.getDeadlineWarningMessage(warning, booking);
          notifications.push({
            type: 'DEADLINE',
            message,
            timestamp: new Date().toISOString()
          });
          this.lastDeadlineWarning.set(booking.id, timeLeft);
          break; // Only send one deadline warning at a time
        }
      }
    }

    // If we have notifications, send them
    if (notifications.length > 0) {
      await this.sendNotifications(booking.id, notifications);
    }

    return notifications;
  }

  getProgressMessage(milestone, booking) {
    const messages = {
      STARTED: `Shipping has started for your ${booking.commodity} delivery from ${booking.loadingPoint} to ${booking.destination}.`,
      QUARTER: `25% of your shipment (${booking.total_tonnage} tons) has been completed.`,
      HALF: `Halfway there! 50% of your shipment has been completed.`,
      THREE_QUARTERS: `75% of your shipment is now complete. Almost there!`,
      COMPLETED: `Great news! Your entire shipment has been completed.`
    };
    return messages[milestone];
  }

  getDeadlineWarningMessage(warning, booking) {
    const messages = {
      WEEK: `Your shipment deadline is in 1 week. Current progress: ${booking.completion_percentage}%`,
      THREE_DAYS: `Important: Your shipment deadline is in 3 days. Current progress: ${booking.completion_percentage}%`,
      ONE_DAY: `Urgent: Your shipment deadline is tomorrow. Current progress: ${booking.completion_percentage}%`
    };
    return messages[warning];
  }

  async sendNotifications(bookingId, notifications) {
    try {
      await deliveryApi.updateMilestoneNotifications(bookingId, notifications);
      
      // Get booking details for SMS
      const booking = await deliveryApi.getParentBooking(bookingId);
      
      // Send SMS for each notification
      for (const notification of notifications) {
        await deliveryApi.sendSms(booking.phoneNumber, notification.message);
      }
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }
}

export const notificationService = new NotificationService(); 