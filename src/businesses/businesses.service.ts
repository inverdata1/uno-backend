import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, data: any) {
    if (!ownerId) {
      throw new UnauthorizedException(
        'User ID is required to create a business',
      );
    }

    const business = await this.prisma.business.create({
      data: {
        ownerId,
        businessName: data.businessName,
        description: data.description,
        businessHours: data.businessHours,
        businessType: data.businessType,
        category: data.category,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        status: 'active',
        branches: {
          create: {
            name: 'Sede Principal',
            isMain: true,
            address: data.address
              ? { street: data.address, coordinates: data.coordinates }
              : undefined,
            latitude: data.coordinates?.latitude
              ? data.coordinates.latitude
              : undefined,
            longitude: data.coordinates?.longitude
              ? data.coordinates.longitude
              : undefined,
            phone: data.phone,
            status: 'active',
          },
        },
      },
      include: {
        branches: true,
      },
    });

    return business;
  }

  async getProfile(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        branches: {
          where: { isMain: true },
          take: 1
        },
        _count: {
          select: { products: true, posts: true, followers: true }
        }
      }
    });

    if (!business) {
      throw new UnauthorizedException('Business not found');
    }

    const mainBranch = business.branches?.[0];

    return {
      ...business,
      address: mainBranch?.address ? (mainBranch.address as any).street : null,
      coordinates: mainBranch?.latitude && mainBranch?.longitude ? {
        latitude: mainBranch.latitude,
        longitude: mainBranch.longitude
      } : null,
      phone: mainBranch?.phone || null,
      productsCount: business._count?.products || 0,
      postsCount: business._count?.posts || 0,
    };
  }

  async updateProfile(businessId: string, data: any) {
    // Extract branch specific data
    const { address, coordinates, phone, ...businessData } = data;

    // Remove empty fields that shouldn't be overwritten with undefined if they are not provided
    const validBusinessData = Object.fromEntries(
      Object.entries(businessData).filter(([_, v]) => v !== undefined)
    );

    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: validBusinessData,
    });

    if (address !== undefined || phone !== undefined || coordinates !== undefined) {
      const mainBranch = await this.prisma.branch.findFirst({
        where: { businessId, isMain: true }
      });

      if (mainBranch) {
        const branchUpdateData: any = {};
        if (address !== undefined || coordinates !== undefined) {
          branchUpdateData.address = address 
            ? { street: address, coordinates: coordinates || mainBranch.address?.['coordinates'] }
            : mainBranch.address;
          if (coordinates?.latitude) branchUpdateData.latitude = coordinates.latitude;
          if (coordinates?.longitude) branchUpdateData.longitude = coordinates.longitude;
        }
        if (phone !== undefined) {
          branchUpdateData.phone = phone;
        }

        await this.prisma.branch.update({
          where: { id: mainBranch.id },
          data: branchUpdateData
        });
      }
    }

    return this.getProfile(businessId);
  }

  async findAll() {
    return this.prisma.business.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(query: string) {
    if (!query || !query.trim()) return [];

    return this.prisma.business.findMany({
      where: {
        isActive: true,
        OR: [
          { businessName: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { businessType: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async discover() {
    const [featured, businesses, trendingPosts] = await Promise.all([
      this.prisma.business.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.business.findMany({
        where: { isActive: true, category: { not: null } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.findMany({
        where: { isActive: true, isPublished: true },
        orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
        take: 15,
        include: {
          business: { select: { id: true, businessName: true, logoUrl: true } },
        },
      }),
    ]);

    const byCategory = new Map<string, any[]>();
    for (const business of businesses) {
      const category = business.category as string;
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push(business);
    }

    const categories = Array.from(byCategory.entries()).map(([category, items]) => ({
      category,
      businesses: items.slice(0, 10),
    }));

    return { featured, categories, trendingPosts };
  }

  findOne(id: number) {
    return `This action returns a #${id} business`;
  }

  update(id: number, updateBusinessDto: UpdateBusinessDto) {
    return `This action updates a #${id} business`;
  }

  remove(id: number) {
    return `This action removes a #${id} business`;
  }
}
