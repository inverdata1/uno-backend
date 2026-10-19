import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CARACAS_OFFSET_MS } from '../payments/payments.service';

const toDay = (date: Date) =>
  new Date(date.getTime() + CARACAS_OFFSET_MS).toISOString().slice(0, 10);

/**
 * Records that a user used the app on a given day (Venezuela time), so the
 * admin dashboard can count monthly active users.
 */
@Injectable()
export class ActivityService {
  // userIds already recorded today; avoids a DB write on every request
  private seenToday = new Set<string>();
  private currentDay = toDay(new Date());

  constructor(private readonly prisma: PrismaService) {}

  touch(userId: string) {
    if (!userId) return;

    const day = toDay(new Date());
    if (day !== this.currentDay) {
      this.currentDay = day;
      this.seenToday = new Set();
    }
    if (this.seenToday.has(userId)) return;
    this.seenToday.add(userId);

    // Fire and forget: tracking must never slow down or fail a request
    this.prisma.userActivityDay
      .upsert({
        where: { userId_day: { userId, day } },
        create: { userId, day },
        update: {},
      })
      .catch((error) => {
        this.seenToday.delete(userId);
        console.error('Could not record user activity:', error?.message);
      });
  }
}
