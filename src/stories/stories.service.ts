import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { businessId: string; userId: string; mediaUrl: string; mediaType: string; duration?: number; tags?: any, expiresInHours?: number }) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));
    
    // Extract expiresInHours so it doesn't go into prisma if it's not a column
    const { expiresInHours, ...prismaData } = data;

    return this.prisma.story.create({
      data: {
        ...prismaData,
        expiresAt,
      },
    });
  }

  async findByBusiness(businessId: string) {
    const now = new Date();
    return this.prisma.story.findMany({
      where: {
        businessId,
        isActive: true,
        expiresAt: {
          gt: now, // Greater than now
        },
      },
      orderBy: {
        createdAt: 'asc',
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

  async findAll() {
    const now = new Date();
    // Return all active stories grouped by business or flat (depending on what frontend expects)
    // The frontend expects an array of business groups: { businessId, business: {...}, stories: [...] }
    // Let's fetch all active stories and group them
    const stories = await this.prisma.story.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'asc',
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

    const groups = {};
    for (const story of stories) {
      if (!groups[story.businessId]) {
        groups[story.businessId] = {
          businessId: story.businessId,
          business: story.business,
          stories: []
        };
      }
      groups[story.businessId].stories.push(story);
    }
    return Object.values(groups);
  }

  async delete(id: string) {
    return this.prisma.story.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
