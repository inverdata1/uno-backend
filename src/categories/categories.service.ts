import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCategoryDto: any) {
    return this.prisma.category.create({ data: createCategoryDto });
  }

  findAll(businessId?: string) {
    const where = businessId ? { businessId } : {};
    return this.prisma.category.findMany({ where });
  }

  findOne(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  update(id: string, updateCategoryDto: any) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
