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

  findAll() {
    return [];
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
