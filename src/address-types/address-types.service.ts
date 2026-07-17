import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const types = await this.prisma.addressType.findMany();
    // Temporary fallback if empty since we are not seeding
    if (types.length === 0) {
      return [
        { id: '1', name: 'Casa', icon: 'home-outline' },
        { id: '2', name: 'Trabajo', icon: 'briefcase-outline' },
        { id: '3', name: 'Otro', icon: 'location-outline' }
      ];
    }
    return types;
  }
}
