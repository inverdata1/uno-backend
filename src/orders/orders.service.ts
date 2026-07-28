import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }

  findAll(businessId?: string, status?: string) {
    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (status) where.status = status;
    return this.prisma.order.findMany({
      where,
      include: { items: true, client: true },
    });
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, client: true },
    });
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }
}
