import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async findByBusiness(businessId: string, userId?: string) {
    const posts = await this.prisma.post.findMany({
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

    if (!userId) {
      return posts.map(post => ({ ...post, isLiked: false }));
    }

    const [userLikes, userFavorites] = await Promise.all([
      this.prisma.userInteraction.findMany({
        where: { userId, action: 'LIKE_POST' },
        select: { postId: true },
      }),
      this.prisma.favorite.findMany({
        where: { userId, entityType: 'post' },
        select: { entityId: true },
      }),
    ]);

    const likedPostIds = new Set([
      ...userLikes.map((l: any) => l.postId),
      ...userFavorites.map((f: any) => f.entityId),
    ]);

    return posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));
  }

  async findOne(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
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

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (!userId) {
      return { ...post, isLiked: false };
    }

    const [userLike, userFavorite] = await Promise.all([
      this.prisma.userInteraction.findFirst({
        where: { userId, postId: id, action: 'LIKE_POST' },
      }),
      this.prisma.favorite.findFirst({
        where: { userId, entityId: id, entityType: 'post' },
      }),
    ]);

    return {
      ...post,
      isLiked: Boolean(userLike || userFavorite),
    };
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

    const [userLikes, userFavorites] = await Promise.all([
      this.prisma.userInteraction.findMany({
        where: { userId, action: 'LIKE_POST' },
        select: { postId: true },
      }),
      this.prisma.favorite.findMany({
        where: { userId, entityType: 'post' },
        select: { entityId: true },
      }),
    ]);

    const likedPostIds = new Set([
      ...userLikes.map((l: any) => l.postId),
      ...userFavorites.map((f: any) => f.entityId),
    ]);

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
      throw new BadRequestException('Debes iniciar sesión para dar me gusta o guardar en favoritos');
    }

    const [existingInteraction, existingFavorite] = await Promise.all([
      this.prisma.userInteraction.findFirst({
        where: { userId, postId: id, action: 'LIKE_POST' },
      }),
      this.prisma.favorite.findFirst({
        where: { userId, entityId: id, entityType: 'post' },
      }),
    ]);

    if (existingInteraction || existingFavorite) {
      await Promise.all([
        this.prisma.userInteraction.deleteMany({
          where: { userId, postId: id, action: 'LIKE_POST' },
        }).catch(() => null),
        this.prisma.favorite.deleteMany({
          where: { userId, entityId: id, entityType: 'post' },
        }).catch(() => null),
      ]);

      const actualCount = await this.prisma.favorite.count({
        where: { entityId: id, entityType: 'post' },
      });
      const updated = await this.prisma.post.update({
        where: { id },
        data: { likeCount: actualCount },
      });
      return { isLiked: false, isFavorite: false, likeCount: updated.likeCount };
    } else {
      await Promise.all([
        this.prisma.userInteraction.create({
          data: { userId, action: 'LIKE_POST', postId: id },
        }).catch(() => null),
        this.prisma.favorite.upsert({
          where: {
            userId_entityId_entityType: {
              userId,
              entityId: id,
              entityType: 'post',
            },
          },
          create: {
            userId,
            entityId: id,
            entityType: 'post',
          },
          update: {},
        }).catch(() => null),
      ]);

      const actualCount = await this.prisma.favorite.count({
        where: { entityId: id, entityType: 'post' },
      });
      const updated = await this.prisma.post.update({
        where: { id },
        data: { likeCount: actualCount },
      });
      return { isLiked: true, isFavorite: true, likeCount: updated.likeCount };
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
    const res = await this.like(postId, userId);
    return {
      isFavorite: res.isLiked,
      likeCount: res.likeCount,
      message: res.isLiked ? 'Publicación guardada en favoritos' : 'Publicación eliminada de favoritos',
    };
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
