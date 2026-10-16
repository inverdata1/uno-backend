import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { CreateOrderDto } from './dto/create-order.dto';

export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
  'rejected',
  'cancelled',
] as const;

const DELIVERY_METHODS = ['delivery', 'pickup'];
const PAYMENT_METHODS = ['pago_movil', 'efectivo', 'zelle', 'transferencia'];

// Statuses the business may move an order to from each status
const BUSINESS_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  // on_the_way only applies to delivery orders; pickups go straight to delivered
  ready: ['on_the_way', 'delivered', 'cancelled'],
  on_the_way: ['delivered', 'cancelled'],
};

// The client can only back out before the business accepts
const CLIENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['cancelled'],
};

const STATUS_MESSAGES: Record<string, string> = {
  accepted: '✅ Tu pedido fue aceptado',
  preparing: '👨‍🍳 Estamos preparando tu pedido',
  ready: '📦 Tu pedido está listo',
  on_the_way: '🛵 Tu pedido va en camino',
  delivered: '🎉 Pedido entregado. ¡Gracias por tu compra!',
  rejected: '❌ El negocio no pudo aceptar tu pedido',
  cancelled: '🚫 El pedido fue cancelado',
};

const CLIENT_SELECT = {
  id: true,
  displayName: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
};

const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, thumbnailUrl: true, images: true },
      },
    },
  },
  client: { select: CLIENT_SELECT },
  business: {
    select: { id: true, businessName: true, logoUrl: true, ownerId: true },
  },
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  private async assertBusinessOwner(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');
    if (business.ownerId !== userId) {
      throw new ForbiddenException(
        'No tienes acceso a los pedidos de este negocio',
      );
    }
  }

  private generateOrderNumber() {
    const time = Date.now().toString(36).toUpperCase().slice(-5);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `UNO-${time}${rand}`;
  }

  // Order details travel inside chat messages as JSON in `mediaUrl`
  private orderCardPayload(order: any) {
    return {
      type: 'order',
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.totalAmount),
      currency: 'USD',
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      itemsCount:
        order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? 0,
      items: (order.items || []).slice(0, 4).map((i: any) => ({
        name: i.product?.name,
        quantity: i.quantity,
      })),
      businessName: order.business?.businessName,
      businessLogo: order.business?.logoUrl,
    };
  }

  // Chat is a side channel: a failure here must never fail the order itself
  private async postToChat(
    order: any,
    from: 'user' | 'business',
    content: string,
    payload: any,
  ) {
    try {
      const conversation = await this.chatService.getOrCreateConversation(
        order.clientId,
        'user',
        order.businessId,
        'business',
      );
      const fromUser = from === 'user';
      await this.chatService.sendMessage({
        conversationId: conversation.id,
        senderId: fromUser ? order.clientId : order.businessId,
        senderType: from,
        receiverId: fromUser ? order.businessId : order.clientId,
        receiverType: fromUser ? 'business' : 'user',
        content,
        mediaUrl: JSON.stringify(payload),
      });
      return conversation.id as string;
    } catch (error) {
      console.error('Could not post order message to chat:', error);
      return null;
    }
  }

  async create(clientId: string, dto: CreateOrderDto) {
    if (!dto?.businessId)
      throw new BadRequestException('businessId es requerido');
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('El pedido no tiene productos');
    }

    const deliveryMethod = dto.deliveryMethod || 'delivery';
    if (!DELIVERY_METHODS.includes(deliveryMethod)) {
      throw new BadRequestException('Tipo de entrega inválido');
    }
    if (dto.paymentMethod && !PAYMENT_METHODS.includes(dto.paymentMethod)) {
      throw new BadRequestException('Método de pago inválido');
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, businessId: dto.businessId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Prices always come from the database, never from the client
    const lines = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          'Uno de los productos ya no existe en este negocio',
        );
      }
      if (!product.isActive || !product.isAvailable) {
        throw new BadRequestException(`"${product.name}" no está disponible`);
      }
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const unitPrice =
        product.isDiscountActive && product.discountPrice != null
          ? Number(product.discountPrice)
          : Number(product.price);
      return {
        productId: product.id,
        quantity,
        unitPrice,
        totalPrice: Math.round(unitPrice * quantity * 100) / 100,
        options: item.options ?? undefined,
      };
    });

    const subtotal =
      Math.round(lines.reduce((sum, l) => sum + l.totalPrice, 0) * 100) / 100;
    const deliveryFee = 0;

    const mainBranch = await this.prisma.branch.findFirst({
      where: { businessId: dto.businessId, isMain: true },
      select: { id: true },
    });

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        clientId,
        businessId: dto.businessId,
        branchId: mainBranch?.id,
        status: 'pending',
        subtotal,
        deliveryFee,
        totalAmount: subtotal + deliveryFee,
        deliveryMethod,
        deliveryAddress: dto.deliveryAddress ?? undefined,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes?.trim() || undefined,
        statusHistory: [
          { status: 'pending', at: new Date().toISOString(), by: 'client' },
        ],
        items: { create: lines },
      },
      include: ORDER_INCLUDE,
    });

    const conversationId = await this.postToChat(
      order,
      'user',
      `🧾 Nuevo pedido ${order.orderNumber}`,
      this.orderCardPayload(order),
    );

    return { ...order, conversationId };
  }

  async findForBusiness(userId: string, businessId: string, status?: string) {
    if (!businessId) throw new BadRequestException('businessId es requerido');
    await this.assertBusinessOwner(businessId, userId);

    const where: any = { businessId };
    if (status) where.status = { in: status.split(',') };
    return this.prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForClient(userId: string) {
    return this.prisma.order.findMany({
      where: { clientId: userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getAccessibleOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const isClient = order.clientId === userId;
    const isBusiness = order.business?.ownerId === userId;
    if (!isClient && !isBusiness)
      throw new ForbiddenException('No tienes acceso a este pedido');

    return { order, isClient, isBusiness };
  }

  async findOne(id: string, userId: string) {
    const { order } = await this.getAccessibleOrder(id, userId);
    return order;
  }

  async updateStatus(
    id: string,
    userId: string,
    status: string,
    reason?: string,
  ) {
    const { order, isClient, isBusiness } = await this.getAccessibleOrder(
      id,
      userId,
    );

    const allowed = [
      ...(isBusiness ? BUSINESS_TRANSITIONS[order.status] || [] : []),
      ...(isClient ? CLIENT_TRANSITIONS[order.status] || [] : []),
    ];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        'No se puede cambiar el pedido a ese estado',
      );
    }
    if (status === 'on_the_way' && order.deliveryMethod !== 'delivery') {
      throw new BadRequestException(
        'Un pedido para retirar en tienda no va en camino',
      );
    }

    const by = isBusiness ? 'business' : 'client';
    const history = Array.isArray(order.statusHistory)
      ? (order.statusHistory as any[])
      : [];
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        cancelReason: ['cancelled', 'rejected'].includes(status)
          ? reason?.trim() || null
          : undefined,
        statusHistory: [
          ...history,
          { status, at: new Date().toISOString(), by },
        ],
      },
      include: ORDER_INCLUDE,
    });

    // Delivered orders count towards each product's sales
    if (status === 'delivered') {
      await Promise.all(
        updated.items.map((item) =>
          this.prisma.product.update({
            where: { id: item.productId },
            data: { orderCount: { increment: item.quantity } },
          }),
        ),
      );
    }

    let text = STATUS_MESSAGES[status] || 'Tu pedido fue actualizado';
    if (status === 'cancelled' && by === 'client')
      text = '🚫 Cancelé mi pedido';
    if (reason?.trim()) text += `: ${reason.trim()}`;
    await this.postToChat(
      updated,
      by === 'business' ? 'business' : 'user',
      `${text} (${updated.orderNumber})`,
      {
        ...this.orderCardPayload(updated),
        type: 'order_status',
      },
    );

    return updated;
  }

  async updatePayment(id: string, userId: string, paymentStatus: string) {
    const { order, isBusiness } = await this.getAccessibleOrder(id, userId);
    if (!isBusiness)
      throw new ForbiddenException('Solo el negocio puede confirmar pagos');
    if (!['pending', 'paid'].includes(paymentStatus)) {
      throw new BadRequestException('Estado de pago inválido');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus },
      include: ORDER_INCLUDE,
    });

    if (paymentStatus === 'paid') {
      await this.postToChat(
        updated,
        'business',
        `💵 Pago recibido (${updated.orderNumber})`,
        {
          ...this.orderCardPayload(updated),
          type: 'order_status',
        },
      );
    }
    return updated;
  }

  async updateDeliveryLocation(
    id: string,
    userId: string,
    location: { latitude: number; longitude: number; address?: string },
  ) {
    const { order, isClient } = await this.getAccessibleOrder(id, userId);
    if (!isClient)
      throw new ForbiddenException(
        'Solo el cliente puede indicar la ubicación de entrega',
      );
    if (order.deliveryMethod !== 'delivery') {
      throw new BadRequestException('Este pedido es para retirar en tienda');
    }

    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('Ubicación inválida');
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryAddress: {
          latitude,
          longitude,
          address: location.address || null,
        },
      },
      include: ORDER_INCLUDE,
    });
  }
}
