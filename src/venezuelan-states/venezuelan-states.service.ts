import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenezuelanStatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const states = await this.prisma.venezuelanState.findMany();
    // Temporary fallback if empty since we are not seeding
    if (states.length === 0) {
      return [
        { id: '1', name: 'Zulia' },
        { id: '2', name: 'Distrito Capital' },
        { id: '3', name: 'Miranda' },
        { id: '4', name: 'Carabobo' },
        { id: '5', name: 'Aragua' }
      ];
    }
    return states;
  }
}
