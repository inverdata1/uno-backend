import { Controller, Get, Post, Put, Delete, Body, Query, Param, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { AddressesService } from './addresses.service';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.addressesService.findAll(userId);
  }

  @Get('default')
  findDefault(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.addressesService.findDefault(userId);
  }

  @Post()
  create(@Query('userId') userId: string, @Body() data: any) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.addressesService.create(userId, data);
  }

  @Put('id')
  update(
    @Query('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string,
    @Body() data: any
  ) {
    if (!userId || !id) throw new BadRequestException('userId and id are required');
    return this.addressesService.update(id, userId, data);
  }

  @Delete('id')
  remove(
    @Query('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string
  ) {
    if (!userId || !id) throw new BadRequestException('userId and id are required');
    return this.addressesService.remove(id, userId);
  }

  @Post('id/set_default')
  setDefault(
    @Query('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string
  ) {
    if (!userId || !id) throw new BadRequestException('userId and id are required');
    return this.addressesService.setDefault(id, userId);
  }
}
