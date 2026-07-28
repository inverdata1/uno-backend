import { Controller, Get, Param } from '@nestjs/common';

@Controller('posts')
export class PostsController {
  @Get()
  findAll() {
    return [];
  }

  @Get('business/:businessId')
  findByBusiness(@Param('businessId') businessId: string) {
    return [];
  }
}
