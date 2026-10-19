import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PublicCatalogController } from './public-catalog.controller';

@Module({
  controllers: [BusinessesController, PublicCatalogController],
  providers: [BusinessesService],
})
export class BusinessesModule {}
