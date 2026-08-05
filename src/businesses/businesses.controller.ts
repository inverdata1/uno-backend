import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  create(@Req() req, @Body() createBusinessDto: any) {
    const ownerId = req.query.userId as string;
    return this.businessesService.create(ownerId, createBusinessDto);
  }

  @Get('profile')
  getProfile(@Req() req) {
    const businessId = req.query.businessId;
    return this.businessesService.getProfile(businessId as string);
  }

  @Patch('profile')
  updateProfile(@Req() req, @Body() updateBusinessDto: any) {
    const businessId = req.query.businessId;
    return this.businessesService.updateProfile(businessId as string, updateBusinessDto);
  }

  @Get()
  findAll() {
    return this.businessesService.findAll();
  }

  @Get('discover')
  discover() {
    return this.businessesService.discover();
  }

  @Get('search')
  search(@Req() req) {
    return this.businessesService.search(req.query.q as string);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(+id, updateBusinessDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessesService.remove(+id);
  }
}
