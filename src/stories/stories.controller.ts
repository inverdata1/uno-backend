import { Controller, Get, Param, Post, Body, Delete, Query } from '@nestjs/common';
import { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  create(@Body() data: any) {
    return this.storiesService.create(data);
  }

  @Get()
  findAll(@Query('businessId') businessId?: string) {
    if (businessId) {
      return this.storiesService.findByBusiness(businessId);
    }
    return this.storiesService.findAll();
  }

  @Get('business/:businessId')
  findByBusiness(@Param('businessId') businessId: string) {
    return this.storiesService.findByBusiness(businessId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.storiesService.delete(id);
  }
}
