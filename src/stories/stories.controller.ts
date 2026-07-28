import { Controller, Get, Param } from '@nestjs/common';

@Controller('stories')
export class StoriesController {
  @Get()
  findAll() {
    return [];
  }

  @Get('business/:businessId')
  findByBusiness(@Param('businessId') businessId: string) {
    return [];
  }
}
