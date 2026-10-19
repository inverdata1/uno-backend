import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  CARACAS_OFFSET_MS,
  round2,
  toPeriod,
} from '../payments/payments.service';

const MONTHS_OF_ACTIVITY = 6;

// Start (inclusive) and end (exclusive) of a YYYY-MM month in Venezuela time, as UTC instants
const monthRange = (period: string) => {
  const [year, month] = period.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - CARACAS_OFFSET_MS),
    end: new Date(Date.UTC(year, month, 1) - CARACAS_OFFSET_MS),
  };
};

const previousPeriods = (period: string, count: number) => {
  const [year, month] = period.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get commissionRate() {
    const rate = Number(this.config.get<string>('COMMISSION_RATE') ?? 0.03);
    return Number.isFinite(rate) && rate >= 0 && rate < 1 ? rate : 0.03;
  }

  private async activeUsers(period: string) {
    const rows = await this.prisma.userActivityDay.findMany({
      where: { day: { startsWith: period } },
      distinct: ['userId'],
      select: { userId: true },
    });
    return rows.length;
  }

  /**
   * Everything the super user dashboard shows for one month: platform totals,
   * monthly active users, and each business' delivered sales and commission.
   */
  async getOverview(requestedPeriod?: string) {
    const currentPeriod = toPeriod(new Date());
    const period = requestedPeriod || currentPeriod;
    if (!/^\d{4}-\d{2}$/.test(period))
      throw new BadRequestException('Periodo inválido');

    const rate = this.commissionRate;
    const { start, end } = monthRange(period);
    const today =
      toPeriod(new Date()) === period
        ? new Date(Date.now() + CARACAS_OFFSET_MS).toISOString().slice(0, 10)
        : null;

    const [
      usersCount,
      businessesCount,
      newUsers,
      newBusinesses,
      businesses,
      deliveredOrders,
      payments,
      activeToday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.business.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
      this.prisma.business.count({
        where: { createdAt: { gte: start, lt: end } },
      }),
      this.prisma.business.findMany({
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          category: true,
          businessType: true,
          isActive: true,
          createdAt: true,
          owner: {
            select: {
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where: { status: 'delivered' },
        select: {
          businessId: true,
          totalAmount: true,
          statusHistory: true,
          updatedAt: true,
        },
      }),
      this.prisma.commissionPayment.findMany({ where: { period } }),
      today
        ? this.prisma.userActivityDay.count({ where: { day: today } })
        : Promise.resolve(null),
    ]);

    // Delivered sales, by business, for the month and all time
    const monthSales = new Map<string, { orders: number; sales: number }>();
    let allTimeSales = 0;
    for (const order of deliveredOrders) {
      const amount = Number(order.totalAmount);
      allTimeSales += amount;
      const history = Array.isArray(order.statusHistory)
        ? (order.statusHistory as any[])
        : [];
      const deliveredAt = history.find((h) => h?.status === 'delivered')?.at;
      if (
        toPeriod(deliveredAt ? new Date(deliveredAt) : order.updatedAt) !==
        period
      )
        continue;
      const entry = monthSales.get(order.businessId) || { orders: 0, sales: 0 };
      entry.orders += 1;
      entry.sales += amount;
      monthSales.set(order.businessId, entry);
    }

    const paymentByBusiness = new Map(payments.map((p) => [p.businessId, p]));

    const businessRows = businesses
      .map((b) => {
        const sales = monthSales.get(b.id) || { orders: 0, sales: 0 };
        const payment = paymentByBusiness.get(b.id);
        const owner = b.owner;
        return {
          id: b.id,
          businessName: b.businessName,
          logoUrl: b.logoUrl,
          category: b.category || b.businessType,
          isActive: b.isActive,
          createdAt: b.createdAt,
          ownerName:
            owner?.displayName ||
            [owner?.firstName, owner?.lastName].filter(Boolean).join(' ') ||
            null,
          ownerEmail: owner?.email ?? null,
          ordersCount: sales.orders,
          sales: round2(sales.sales),
          commission: round2(sales.sales * rate),
          payment: payment
            ? {
                id: payment.id,
                status: payment.status,
                amount: Number(payment.commissionAmount),
                method: payment.method,
                reference: payment.reference,
                receiptUrl: payment.receiptUrl,
                reportedAt: payment.createdAt,
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          b.sales - a.sales || a.businessName.localeCompare(b.businessName),
      );

    const monthTotalSales = businessRows.reduce((sum, b) => sum + b.sales, 0);
    const collected = businessRows
      .filter((b) => b.payment?.status === 'confirmed')
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

    const activityPeriods = previousPeriods(period, MONTHS_OF_ACTIVITY);
    const activity = await Promise.all(
      activityPeriods.map(async (p) => ({
        period: p,
        activeUsers: await this.activeUsers(p),
      })),
    );

    return {
      period,
      currentPeriod,
      rate,
      totals: {
        users: usersCount,
        businesses: businessesCount,
        newUsers,
        newBusinesses,
        activeUsers: activity[activity.length - 1].activeUsers,
        activeToday,
        sales: round2(monthTotalSales),
        commission: round2(monthTotalSales * rate),
        commissionCollected: round2(collected),
        allTimeSales: round2(allTimeSales),
        allTimeCommission: round2(allTimeSales * rate),
      },
      activity,
      businesses: businessRows,
    };
  }

  async reviewCommissionPayment(id: string, status: string) {
    if (!['confirmed', 'rejected'].includes(status)) {
      throw new BadRequestException('Estado inválido');
    }
    const payment = await this.prisma.commissionPayment.findUnique({
      where: { id },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    return this.prisma.commissionPayment.update({
      where: { id },
      data: { status },
    });
  }
}
