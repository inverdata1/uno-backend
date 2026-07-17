import { Module } from '@nestjs/common';
import { AddressTypesService } from './address-types.service';
import { AddressTypesController } from './address-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AddressTypesController],
  providers: [AddressTypesService]
})
export class AddressTypesModule {}
