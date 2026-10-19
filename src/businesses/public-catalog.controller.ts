import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/public.decorator';

/**
 * Shareable business profile + catalog. Open to anyone with the link, so it
 * only returns what a storefront shows: no owner, no internal counters.
 */
@Controller('public')
export class PublicCatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('businesses/:id')
  async getCatalog(@Param('id') id: string) {
    const business = await this.prisma.business.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        category: true,
        description: true,
        businessHours: true,
        logoUrl: true,
        bannerUrl: true,
        rating: true,
        reviewsCount: true,
        isVerified: true,
        branches: {
          where: { isMain: true },
          take: 1,
          select: { phone: true, address: true },
        },
        categories: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
        products: {
          where: { isActive: true },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            discountPrice: true,
            isDiscountActive: true,
            currency: true,
            thumbnailUrl: true,
            images: true,
            isAvailable: true,
            categoryId: true,
          },
        },
      },
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    const { branches, ...rest } = business;
    const mainBranch = branches[0];
    const address = mainBranch?.address as { street?: string } | null;

    return {
      ...rest,
      phone: mainBranch?.phone ?? null,
      address: address?.street ?? null,
    };
  }
}
