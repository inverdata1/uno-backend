import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      include: {
        type: true,
        state: true
      },
      orderBy: { isDefault: 'desc' }
    });
  }

  async findDefault(userId: string) {
    return this.prisma.address.findFirst({
      where: { userId, isDefault: true },
      include: { type: true, state: true }
    });
  }

  async create(userId: string, data: any) {
    // If this is the first address, make it default automatically
    const existingCount = await this.prisma.address.count({ where: { userId } });
    const isDefault = data.isDefault || existingCount === 0;

    if (isDefault && existingCount > 0) {
      // Unset previous defaults
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        typeId: data.addressTypeId || data.typeId,
        stateId: data.stateId,
        city: data.city,
        street: data.street,
        details: data.references,
        latitude: data.coordinates?.latitude,
        longitude: data.coordinates?.longitude,
        isDefault
      },
      include: { type: true, state: true }
    });
  }

  async update(id: string, userId: string, data: any) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: {
        typeId: data.addressTypeId || data.typeId,
        stateId: data.stateId,
        city: data.city,
        street: data.street,
        details: data.references,
        latitude: data.coordinates?.latitude,
        longitude: data.coordinates?.longitude,
        isDefault: data.isDefault
      },
      include: { type: true, state: true }
    });
  }

  async remove(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    await this.prisma.address.delete({ where: { id } });

    // If we deleted the default, make another one default
    if (address.isDefault) {
      const nextAddress = await this.prisma.address.findFirst({ where: { userId } });
      if (nextAddress) {
        await this.prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true }
        });
      }
    }
    return { success: true };
  }

  async setDefault(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });

    return this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
      include: { type: true, state: true }
    });
  }
}
