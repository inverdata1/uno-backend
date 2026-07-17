import { Controller, Get, Query } from '@nestjs/common';
import { AddressTypesService } from './address-types.service';

@Controller('address_types')
export class AddressTypesController {
  constructor(private readonly addressTypesService: AddressTypesService) {}

  @Get()
  findAll() {
    return this.addressTypesService.findAll();
  }

  @Get('search')
  search(@Query('where') where: string) {
    // For now, ignore the where clause and return all types
    return this.addressTypesService.findAll();
  }
}
