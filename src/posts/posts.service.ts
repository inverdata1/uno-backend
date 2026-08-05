import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { businessId: string; userId: string; media: any; type: string; title?: string; caption?: string; keywords?: any; taggedProducts?: any; thumbnailUrl?: string }) {
    return this.prisma.post.create({
      data: {
        ...data,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  async findByBusiness(businessId: string) {
    return this.prisma.post.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
          }
        }
      }
    });
  }

  async findByProduct(productId: string) {
    if (!productId) return [];
    
    // Fetch all active posts and filter in memory since taggedProducts is a JSON array
    // This is safer for cross-database compatibility (Postgres/SQLite)
    const posts = await this.prisma.post.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
          }
        }
      }
    });

    return posts.filter(post => {
      if (!post.taggedProducts) return false;
      let tags: any = post.taggedProducts;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {}
      }
      if (!Array.isArray(tags)) return false;
      return tags.some((tag: any) => tag.productId === productId);
    });
  }

  async findAll(userId?: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
          }
        }
      }
    });

    if (!userId) {
      return posts.map(post => ({ ...post, isLiked: false }));
    }

    const userLikes = await this.prisma.userInteraction.findMany({
      where: { userId, action: 'LIKE_POST' },
      select: { postId: true },
    });
    const likedPostIds = new Set(userLikes.map(l => l.postId));

    return posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));
  }

  async delete(id: string) {
    try {
      const result = await this.prisma.post.update({
        where: { id },
        data: { isActive: false },
      });
      return result;
    } catch (error) {
      if (error.code === 'P2025') {
        return { success: true, message: 'Post was already deleted or not found' };
      }
      throw error;
    }
  }

  async update(id: string, data: { title?: string; caption?: string; keywords?: any; media?: any; taggedProducts?: any; type?: string }) {
    return this.prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        caption: data.caption,
        keywords: data.keywords,
        media: data.media,
        taggedProducts: data.taggedProducts,
        type: data.type,
      },
    });
  }

  async like(id: string, userId?: string) {
    if (!userId) {
      const updated = await this.prisma.post.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      });
      return { isLiked: true, likeCount: updated.likeCount };
    }

    const existing = await this.prisma.userInteraction.findFirst({
      where: { userId, postId: id, action: 'LIKE_POST' },
    });

    if (existing) {
      await this.prisma.userInteraction.delete({ where: { id: existing.id } });
      const current = await this.prisma.post.findUnique({ where: { id } });
      const newCount = Math.max(0, (current?.likeCount || 1) - 1);
      const updated = await this.prisma.post.update({
        where: { id },
        data: { likeCount: newCount },
      });
      return { isLiked: false, likeCount: updated.likeCount };
    } else {
      await this.prisma.userInteraction.create({
        data: { userId, action: 'LIKE_POST', postId: id },
      });
      const updated = await this.prisma.post.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      });
      return { isLiked: true, likeCount: updated.likeCount };
    }
  }

  async recordInteraction(data: {
    userId?: string;
    action: string;
    postId?: string;
    productId?: string;
    businessId?: string;
    metadata?: any;
  }) {
    // 1. Create interaction record for algorithm analytics
    const interaction = await this.prisma.userInteraction.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        postId: data.postId || null,
        productId: data.productId || null,
        businessId: data.businessId || null,
        metadata: data.metadata || null,
      },
    });

    // 2. Increment counters on corresponding models
    if (data.postId && (data.action === 'VIEW_POST' || data.action === 'FULLSCREEN_VIEW')) {
      await this.prisma.post.update({
        where: { id: data.postId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => null);
    }

    if (data.businessId && data.action === 'VIEW_BUSINESS') {
      await this.prisma.business.update({
        where: { id: data.businessId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => null);
    }

    return interaction;
  }

  async toggleFavoritePost(userId: string, postId: string) {
    const existing = await this.prisma.favorite.findFirst({
      where: { userId, entityId: postId, entityType: 'post' },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorite: false, message: 'Publicación eliminada de favoritos' };
    } else {
      await this.prisma.favorite.create({
        data: { userId, entityId: postId, entityType: 'post' },
      });
      await this.recordInteraction({ userId, action: 'FAVORITE_POST', postId });
      return { isFavorite: true, message: 'Publicación guardada en favoritos' };
    }
  }

  async favoritePostProducts(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || !post.taggedProducts) {
      return { count: 0, message: 'No hay productos etiquetados en este post' };
    }

    let tags: any = post.taggedProducts;
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch (e) {}
    }

    if (!Array.isArray(tags)) return { count: 0, message: 'Sin productos etiquetados' };

    let addedCount = 0;
    for (const tag of tags) {
      const productId = typeof tag === 'object' ? (tag.productId || tag.id) : tag;
      if (!productId) continue;

      const existing = await this.prisma.favorite.findFirst({
        where: { userId, entityId: productId, entityType: 'product' },
      });

      if (!existing) {
        await this.prisma.favorite.create({
          data: { userId, entityId: productId, entityType: 'product' },
        });
        await this.recordInteraction({ userId, action: 'FAVORITE_PRODUCT', productId, postId });
        addedCount++;
      }
    }

    return { count: addedCount, message: `Se añadieron ${addedCount} productos a tus favoritos` };
  }
}
