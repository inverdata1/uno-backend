import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview(@Query('period') period?: string) {
    return this.adminService.getOverview(period);
  }

  @Patch('commission-payments/:id')
  reviewCommissionPayment(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.reviewCommissionPayment(id, body?.status);
  }
}
