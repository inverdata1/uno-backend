import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body() createProductDto: any,
    @Query('businessId') businessId?: string,
  ) {
    if (businessId) {
      createProductDto.businessId = businessId;
    }
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query('businessId') businessId?: string) {
    return this.productsService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.productsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/favorite')
  toggleFavorite(
    @Param('id') id: string,
    @Body('userId') bodyUserId?: string,
    @Query('userId') queryUserId?: string,
    @Req() req?: any,
  ) {
    const userId = bodyUserId || queryUserId || req?.user?.sub || req?.user?.id;
    return this.productsService.toggleFavorite(userId, id);
  }

  @Get(':id/rating-eligibility')
  getRatingEligibility(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.productsService.getRatingEligibility(id, userId);
  }

  @Post(':id/rate')
  rateProduct(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ) {
    return this.productsService.rateProduct(id, userId, Number(rating), comment);
  }
}
