import { Controller, Get, Param, Post, Body, Delete, Patch, Query, Put, Req } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() data: any) {
    return this.postsService.create(data);
  }

  @Get()
  findAll(@Query('businessId') businessId?: string, @Query('userId') userId?: string) {
    if (businessId) {
      return this.postsService.findByBusiness(businessId, userId);
    }
    return this.postsService.findAll(userId);
  }

  @Get('business/:businessId')
  findByBusiness(@Param('businessId') businessId: string, @Query('userId') userId?: string) {
    return this.postsService.findByBusiness(businessId, userId);
  }

  @Get('product')
  findByProduct(@Query('productId') productId: string) {
    return this.postsService.findByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.postsService.findOne(id, userId);
  }

  @Patch(':id/like')
  like(
    @Param('id') id: string,
    @Body('userId') bodyUserId?: string,
    @Query('userId') queryUserId?: string,
    @Req() req?: any,
  ) {
    const userId = bodyUserId || queryUserId || req?.user?.sub || req?.user?.id;
    return this.postsService.like(id, userId);
  }

  @Post('track-interaction')
  trackInteraction(@Body() body: any) {
    return this.postsService.recordInteraction(body);
  }

  @Post(':id/favorite')
  toggleFavoritePost(
    @Param('id') id: string,
    @Body('userId') bodyUserId?: string,
    @Query('userId') queryUserId?: string,
    @Req() req?: any,
  ) {
    const userId = bodyUserId || queryUserId || req?.user?.sub || req?.user?.id;
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
