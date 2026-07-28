import { Module } from '@nestjs/common';
import { VenezuelanStatesService } from './venezuelan-states.service';
import { VenezuelanStatesController } from './venezuelan-states.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VenezuelanStatesController],
  providers: [VenezuelanStatesService],
})
export class VenezuelanStatesModule {}
