import { Controller, Get, Param, Post, Body, Delete, Patch, Query, Put } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() data: any) {
    return this.postsService.create(data);
  }

  @Get()
  findAll(@Query('businessId') businessId?: string) {
    if (businessId) {
      return this.postsService.findByBusiness(businessId);
    }
    return this.postsService.findAll();
  }

  @Get('business/:businessId')
  findByBusiness(@Param('businessId') businessId: string) {
    return this.postsService.findByBusiness(businessId);
  }

  @Get('product')
  findByProduct(@Query('productId') productId: string) {
    return this.postsService.findByProduct(productId);
  }

  @Patch(':id/like')
  like(@Param('id') id: string, @Body('userId') userId?: string) {
    return this.postsService.like(id, userId);
  }

  @Post('track-interaction')
  trackInteraction(@Body() body: any) {
    return this.postsService.recordInteraction(body);
  }

  @Post(':id/favorite')
  toggleFavoritePost(@Param('id') id: string, @Body('userId') userId: string) {
    return this.postsService.toggleFavoritePost(userId, id);
  }

  @Post(':id/favorite-products')
  favoritePostProducts(@Param('id') id: string, @Body('userId') userId: string) {
    return this.postsService.favoritePostProducts(userId, id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.postsService.delete(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.postsService.update(id, data);
  }
}
