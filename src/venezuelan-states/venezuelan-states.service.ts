import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenezuelanStatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // No fallback list here on purpose: it used to return ids that did not exist
    // in the table, so saving an address with one failed a foreign key check.
    // The rows are seeded by migration 20260806130000_seed_address_reference_data.
    return this.prisma.venezuelanState.findMany({ orderBy: { name: 'asc' } });
  }
}
