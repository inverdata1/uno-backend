import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProductDto: any) {
    return this.prisma.product.create({ data: createProductDto });
  }

  findAll(businessId?: string) {
    const where = businessId ? { businessId } : {};
    return this.prisma.product.findMany({ where, include: { category: true } });
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  update(id: string, updateProductDto: any) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async toggleFavorite(userId: string, productId: string) {
    const existing = await this.prisma.favorite.findFirst({
      where: { userId, entityId: productId, entityType: 'product' },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorite: false, message: 'Producto eliminado de favoritos' };
    } else {
      await this.prisma.favorite.create({
        data: { userId, entityId: productId, entityType: 'product' },
      });
      return { isFavorite: true, message: 'Producto guardado en favoritos' };
    }
  }
}
