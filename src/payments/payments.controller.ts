import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { PaymentAccountInput } from './payments.service';

// Set by JwtAuthGuard from the verified token
type AuthRequest = { user: { sub: string } };

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payment-accounts')
  listAccounts(
    @Req() req: AuthRequest,
    @Query('businessId') businessId: string,
  ) {
    return this.paymentsService.listAccounts(req.user.sub, businessId);
  }

  @Post('payment-accounts')
  createAccount(@Req() req: AuthRequest, @Body() body: PaymentAccountInput) {
    return this.paymentsService.createAccount(req.user.sub, body);
  }

  @Patch('payment-accounts/:id')
  updateAccount(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: PaymentAccountInput,
  ) {
    return this.paymentsService.updateAccount(id, req.user.sub, body);
  }

  @Delete('payment-accounts/:id')
  removeAccount(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.paymentsService.removeAccount(id, req.user.sub);
  }

  @Get('commissions')
  getCommissions(
    @Req() req: AuthRequest,
    @Query('businessId') businessId: string,
  ) {
    return this.paymentsService.getCommissions(req.user.sub, businessId);
  }

  @Post('commissions/:period/report')
  reportCommissionPayment(
    @Req() req: AuthRequest,
    @Param('period') period: string,
    @Body()
    body: {
      businessId?: string;
      method?: string;
      reference?: string;
      receiptUrl?: string;
    },
  ) {
    return this.paymentsService.reportCommissionPayment(
      req.user.sub,
      period,
      body,
    );
  }
}
