import { Injectable, BadRequestException } from '@nestjs/common';
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
    return this.prisma.product.findMany({ where, include: { category: true, business: true } });
  }

  async findOne(id: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, business: true },
    });

    if (!product) return null;

    let isFavorited = false;
    if (userId) {
      const fav = await this.prisma.favorite.findFirst({
        where: { userId, entityId: id, entityType: 'product' },
      });
      isFavorited = !!fav;
    }

    return {
      ...product,
      isFavorited,
    };
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
    if (!userId) {
      throw new BadRequestException('Debes iniciar sesión para guardar productos en favoritos');
    }

    const existing = await this.prisma.favorite.findFirst({
      where: { userId, entityId: productId, entityType: 'product' },
    });

    if (existing) {
      await this.prisma.favorite.deleteMany({
        where: { userId, entityId: productId, entityType: 'product' },
      });
      const actualCount = await this.prisma.favorite.count({
        where: { entityId: productId, entityType: 'product' },
      });
      const updated = await this.prisma.product.update({
        where: { id: productId },
        data: { favoriteCount: actualCount },
      }).catch(() => null);

      return {
        isFavorite: false,
        favoriteCount: updated?.favoriteCount ?? actualCount,
        message: 'Producto eliminado de favoritos'
      };
    } else {
      await this.prisma.favorite.upsert({
        where: {
          userId_entityId_entityType: {
            userId,
            entityId: productId,
            entityType: 'product',
          },
        },
        create: {
          userId,
          entityId: productId,
          entityType: 'product',
        },
        update: {},
      });
      const actualCount = await this.prisma.favorite.count({
        where: { entityId: productId, entityType: 'product' },
      });
      const updated = await this.prisma.product.update({
        where: { id: productId },
        data: { favoriteCount: actualCount },
      }).catch(() => null);

      return {
        isFavorite: true,
        favoriteCount: updated?.favoriteCount ?? actualCount,
        message: 'Producto guardado en favoritos'
      };
    }
  }

  async getRatingEligibility(productId: string, userId: string) {
    if (!userId) {
      return { canRate: false, purchaseCount: 0, ratingCount: 0, message: 'Inicia sesión para calificar' };
    }

    // Check how many orders contain this product for this client
    const purchaseCount = await this.prisma.order.count({
      where: {
        clientId: userId,
        items: {
          some: { productId },
        },
      },
    });

    // Check how many reviews this client has submitted for this product
    const ratingInteractions = await this.prisma.userInteraction.findMany({
      where: {
        userId,
        productId,
        action: 'RATE_PRODUCT',
      },
      orderBy: { createdAt: 'desc' },
    });

    const ratingCount = ratingInteractions.length;
    const latestRating = ratingInteractions.length > 0 ? (ratingInteractions[0].metadata as any) : null;

    if (purchaseCount === 0) {
      return {
        canRate: false,
        purchaseCount: 0,
        ratingCount: 0,
        existingRating: null,
        message: 'Solo puedes calificar productos que hayas comprado.',
      };
    }

    if (ratingCount >= purchaseCount) {
      return {
        canRate: false,
        purchaseCount,
        ratingCount,
        existingRating: latestRating,
        message: 'Ya has calificado tus compras anteriores. Podrás actualizar tu calificación tras una nueva compra.',
      };
    }

    return {
      canRate: true,
      purchaseCount,
      ratingCount,
      existingRating: latestRating,
      message: 'Puedes calificar este producto.',
    };
  }

  async rateProduct(productId: string, userId: string, score: number, comment?: string) {
    if (!userId) {
      throw new BadRequestException('Debes iniciar sesión para calificar.');
    }

    if (typeof score !== 'number' || score < 0.5 || score > 5) {
      throw new BadRequestException('La calificación debe ser entre 0.5 y 5 estrellas.');
    }

    const eligibility = await this.getRatingEligibility(productId, userId);
    if (!eligibility.canRate) {
      throw new BadRequestException(eligibility.message);
    }

    // Save interaction
    await this.prisma.userInteraction.create({
      data: {
        userId,
        productId,
        action: 'RATE_PRODUCT',
        metadata: {
          rating: score,
          comment: comment || '',
          ratedAt: new Date(),
        },
      },
    });

    // Recalculate average rating for product
    const allRatings = await this.prisma.userInteraction.findMany({
      where: { productId, action: 'RATE_PRODUCT' },
    });

    const validScores = allRatings
      .map((r) => (r.metadata as any)?.rating)
      .filter((s) => typeof s === 'number' && s >= 0.5 && s <= 5);

    const avgRating =
      validScores.length > 0
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : score;

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: avgRating,
        reviewCount: validScores.length,
      },
      include: { category: true, business: true },
    });

    // Update business average rating based on all products
    if (updatedProduct.businessId) {
      const businessProducts = await this.prisma.product.findMany({
        where: { businessId: updatedProduct.businessId },
      });

      const bScores = businessProducts
        .map((p) => Number(p.rating))
        .filter((r) => r > 0);

      const bAvg =
        bScores.length > 0
          ? bScores.reduce((a, b) => a + b, 0) / bScores.length
          : 0;

      await this.prisma.business.update({
        where: { id: updatedProduct.businessId },
        data: {
          rating: bAvg,
        },
      });
    }

    return {
      success: true,
      product: updatedProduct,
      rating: Number(avgRating.toFixed(1)),
      reviewCount: validScores.length,
      message: '¡Gracias por calificar este producto!',
    };
  }
}
