import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export const ACCOUNT_TYPES = ['pago_movil', 'zelle', 'binance'] as const;

// Fields each account type needs to be usable by a client paying
const REQUIRED_FIELDS: Record<string, string[]> = {
  pago_movil: ['bankName', 'phone', 'documentId'],
  zelle: ['holderName'],
  binance: [],
};

const ACCOUNT_FIELDS = [
  'bankName',
  'holderName',
  'documentId',
  'phone',
  'email',
  'accountId',
] as const;

export type PaymentAccountInput = {
  businessId?: string;
  type?: string;
} & Partial<Record<(typeof ACCOUNT_FIELDS)[number], string>>;

// Months are counted in Venezuela time (UTC-4, no DST)
const CARACAS_OFFSET_MS = -4 * 60 * 60 * 1000;

const toPeriod = (date: Date) => {
  const local = new Date(date.getTime() + CARACAS_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get commissionRate() {
    const rate = Number(this.config.get<string>('COMMISSION_RATE') ?? 0.03);
    return Number.isFinite(rate) && rate >= 0 && rate < 1 ? rate : 0.03;
  }

  // UNO's own accounts where businesses pay their commission, set on the server
  // as a JSON array in UNO_PAYMENT_ACCOUNTS
  private get platformAccounts(): any[] {
    const raw = this.config.get<string>('UNO_PAYMENT_ACCOUNTS');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.error('UNO_PAYMENT_ACCOUNTS is not valid JSON');
      return [];
    }
  }

  private async assertBusinessOwner(businessId: string, userId: string) {
    if (!businessId) throw new BadRequestException('businessId es requerido');
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');
    if (business.ownerId !== userId) {
      throw new ForbiddenException('No tienes acceso a este negocio');
    }
  }

  private cleanAccount(input: PaymentAccountInput, type: string) {
    const data: Record<string, string | null> = {};
    for (const field of ACCOUNT_FIELDS) {
      const value = input[field];
      data[field] =
        typeof value === 'string' && value.trim() ? value.trim() : null;
    }

    const missing = (REQUIRED_FIELDS[type] || []).filter((f) => !data[f]);
    if (missing.length) {
      throw new BadRequestException(
        `Faltan datos de la cuenta: ${missing.join(', ')}`,
      );
    }
    if (type === 'zelle' && !data.email && !data.phone) {
      throw new BadRequestException('Zelle necesita un correo o un teléfono');
    }
    if (type === 'binance' && !data.email && !data.accountId) {
      throw new BadRequestException('Binance necesita el Pay ID o el correo');
    }
    return data;
  }

  // ---------- Payment accounts ----------

  async listAccounts(userId: string, businessId: string) {
    await this.assertBusinessOwner(businessId, userId);
    return this.prisma.businessPaymentAccount.findMany({
      where: { businessId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAccount(userId: string, input: PaymentAccountInput) {
    const businessId = input?.businessId as string;
    await this.assertBusinessOwner(businessId, userId);

    const type = input.type as string;
    if (!ACCOUNT_TYPES.includes(type as any)) {
      throw new BadRequestException('Tipo de cuenta inválido');
    }

    return this.prisma.businessPaymentAccount.create({
      data: { businessId, type, ...this.cleanAccount(input, type) },
    });
  }

  private async getOwnedAccount(id: string, userId: string) {
    const account = await this.prisma.businessPaymentAccount.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });
    if (!account || !account.isActive)
      throw new NotFoundException('Cuenta no encontrada');
    if (account.business.ownerId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta cuenta');
    }
    return account;
  }

  async updateAccount(id: string, userId: string, input: PaymentAccountInput) {
    const account = await this.getOwnedAccount(id, userId);
    return this.prisma.businessPaymentAccount.update({
      where: { id },
      data: this.cleanAccount(
        { ...account, ...input } as PaymentAccountInput,
        account.type,
      ),
    });
  }

  async removeAccount(id: string, userId: string) {
    await this.getOwnedAccount(id, userId);
    // Soft delete: accounts already sent in chats keep making sense
    await this.prisma.businessPaymentAccount.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  // ---------- Commissions ----------

  /**
   * Delivered sales grouped by month with the app commission owed for each,
   * merged with any payment the business already reported.
   */
  async getCommissions(userId: string, businessId: string) {
    await this.assertBusinessOwner(businessId, userId);

    const [orders, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: { businessId, status: 'delivered' },
        select: { totalAmount: true, statusHistory: true, updatedAt: true },
      }),
      this.prisma.commissionPayment.findMany({ where: { businessId } }),
    ]);

    const rate = this.commissionRate;
    const months = new Map<string, { ordersCount: number; sales: number }>();

    for (const order of orders) {
      const history = Array.isArray(order.statusHistory)
        ? (order.statusHistory as any[])
        : [];
      const deliveredAt = history.find((h) => h?.status === 'delivered')?.at;
      const period = toPeriod(
        deliveredAt ? new Date(deliveredAt) : order.updatedAt,
      );
      const month = months.get(period) || { ordersCount: 0, sales: 0 };
      month.ordersCount += 1;
      month.sales += Number(order.totalAmount);
      months.set(period, month);
    }

    const paymentByPeriod = new Map(payments.map((p) => [p.period, p]));
    const currentPeriod = toPeriod(new Date());

    const periods = [...new Set([...months.keys(), ...paymentByPeriod.keys()])]
      .sort()
      .reverse();

    return {
      rate,
      currentPeriod,
      platformAccounts: this.platformAccounts,
      months: periods.map((period) => {
        const month = months.get(period) || { ordersCount: 0, sales: 0 };
        const payment = paymentByPeriod.get(period);
        return {
          period,
          isCurrent: period === currentPeriod,
          ordersCount: month.ordersCount,
          sales: round2(month.sales),
          commission: round2(month.sales * rate),
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
      }),
    };
  }

  async reportCommissionPayment(
    userId: string,
    period: string,
    body: {
      businessId?: string;
      method?: string;
      reference?: string;
      receiptUrl?: string;
    },
  ) {
    const businessId = body?.businessId as string;
    if (!/^\d{4}-\d{2}$/.test(period))
      throw new BadRequestException('Periodo inválido');
    if (!body?.reference?.trim() && !body?.receiptUrl) {
      throw new BadRequestException(
        'Indica la referencia o adjunta el comprobante',
      );
    }

    const summary = await this.getCommissions(userId, businessId);
    const month = summary.months.find((m) => m.period === period);
    if (!month || month.commission <= 0) {
      throw new BadRequestException('No hay comisión pendiente para ese mes');
    }
    if (month.payment?.status === 'confirmed') {
      throw new BadRequestException('La comisión de ese mes ya está pagada');
    }

    const data = {
      salesAmount: month.sales,
      commissionAmount: month.commission,
      rate: summary.rate,
      status: 'reported',
      method: body.method?.trim() || null,
      reference: body.reference?.trim() || null,
      receiptUrl: body.receiptUrl || null,
    };

    return this.prisma.commissionPayment.upsert({
      where: { businessId_period: { businessId, period } },
      create: { businessId, period, ...data },
      update: data,
    });
  }
}
