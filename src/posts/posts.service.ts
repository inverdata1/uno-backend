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
      if (!post.taggedProducts || !Array.isArray(post.taggedProducts)) return false;
      return post.taggedProducts.some((tag: any) => tag.productId === productId);
    });
  }

  async findAll() {
    return this.prisma.post.findMany({
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
  }

  async delete(id: string) {
    console.log(`[PostsService] Attempting to delete post with ID: "${id}"`);
    try {
      const result = await this.prisma.post.update({
        where: { id },
        data: { isActive: false },
      });
      console.log(`[PostsService] Successfully deleted post ID: "${id}"`);
      return result;
    } catch (error) {
      console.error(`[PostsService] Error deleting post ID: "${id}"`, error.code, error.message);
      if (error.code === 'P2025') {
        console.log(`[PostsService] Post not found (P2025), returning success anyway.`);
        // Record not found, might have been deleted already.
        // We can just return success or throw a 404. Let's return true.
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

  async like(id: string) {
    return this.prisma.post.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });
  }
}
