export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'PROCESSED';

export type CreateOrderInput = {
  customerId: string;
  pair: string;
  side: OrderSide;
  amount: number;
  forceFailProcessing: boolean;
};

export type OrderItem = {
  orderId: string;
  customerId: string;
  pair: string;
  side: OrderSide;
  amount: number;
  status: OrderStatus;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  receiptKey?: string;
  forceFailProcessing: boolean;
};
