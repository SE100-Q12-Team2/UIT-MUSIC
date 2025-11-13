import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { NotificationService } from './notification.service'

@Injectable()
export class NotificationCron {
  private readonly logger = new Logger(NotificationCron.name)

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanupOldNotifications() {
    this.logger.log('Starting cleanup of old notifications...')

    try {
      const result = await this.notificationService.cleanupOldNotifications(30)

      this.logger.log(`Successfully cleaned up ${result.deletedCount} old notifications`)
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications', error)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleExpiringSubscriptions() {
    this.logger.log('Checking for expiring subscriptions...')

    try {
      const now = new Date()
      const daysToCheck = [7, 3, 1]

      for (const days of daysToCheck) {
        const targetDate = new Date(now)
        targetDate.setDate(targetDate.getDate() + days)
        targetDate.setHours(0, 0, 0, 0)

        const endOfTargetDate = new Date(targetDate)
        endOfTargetDate.setHours(23, 59, 59, 999)

        this.logger.log(`Would check for subscriptions expiring in ${days} day(s)`)
      }

      this.logger.log('Finished checking expiring subscriptions')
    } catch (error) {
      this.logger.error('Failed to check expiring subscriptions', error)
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async handleCleanupVeryOldNotifications() {
    this.logger.log('Starting cleanup of very old unread notifications...')

    try {
      const result = await this.notificationService.cleanupOldNotifications(90)

      this.logger.log(`Successfully cleaned up ${result.deletedCount} very old notifications`)
    } catch (error) {
      this.logger.error('Failed to cleanup very old notifications', error)
    }
  }
}
