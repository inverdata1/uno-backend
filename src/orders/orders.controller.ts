import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

// Set by JwtAuthGuard from the verified token
type AuthRequest = { user: { sub: string } };

// The acting user always comes from the verified JWT, never from the request body
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, createOrderDto);
  }

  @Get()
  findForBusiness(
    @Req() req: AuthRequest,
    @Query('businessId') businessId: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findForBusiness(req.user.sub, businessId, status);
  }

  @Get('mine')
  findMine(@Req() req: AuthRequest) {
    return this.ordersService.findForClient(req.user.sub);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.sub);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.ordersService.updateStatus(
      id,
      req.user.sub,
      body?.status,
      body?.reason,
    );
  }

  @Patch(':id/payment')
  updatePayment(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { paymentStatus: string },
  ) {
    return this.ordersService.updatePayment(
      id,
      req.user.sub,
      body?.paymentStatus,
    );
  }

  @Patch(':id/delivery-location')
  updateDeliveryLocation(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number; address?: string },
  ) {
    return this.ordersService.updateDeliveryLocation(id, req.user.sub, body);
  }
}
