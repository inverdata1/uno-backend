import { Controller, Get } from '@nestjs/common';
import { VenezuelanStatesService } from './venezuelan-states.service';

@Controller('venezuelan_states')
export class VenezuelanStatesController {
  constructor(private readonly venezuelanStatesService: VenezuelanStatesService) {}

  @Get()
  findAll() {
    return this.venezuelanStatesService.findAll();
  }
}
