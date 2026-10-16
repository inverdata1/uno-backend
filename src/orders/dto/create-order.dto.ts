export class CreateOrderItemDto {
  productId: string;
  quantity: number;
  options?: any;
}

export class CreateOrderDto {
  businessId: string;
  items: CreateOrderItemDto[];
  deliveryMethod?: 'delivery' | 'pickup';
  paymentMethod?: 'pago_movil' | 'efectivo' | 'zelle' | 'transferencia';
  notes?: string;
  deliveryAddress?: { latitude: number; longitude: number; address?: string };
}
