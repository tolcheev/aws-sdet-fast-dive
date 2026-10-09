export type AppConfig = {
  region: string;
  endpointUrl: string;
  ordersTable: string;
  receiptsBucket: string;
  eventBusName: string;
  orderQueueName: string;
  orderDlqName: string;
  port: number;
};

export function getConfig(): AppConfig {
  return {
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpointUrl: process.env.AWS_ENDPOINT_URL ?? 'http://localhost:4566',
    ordersTable: process.env.ORDERS_TABLE ?? 'orders',
    receiptsBucket: process.env.RECEIPTS_BUCKET ?? 'order-receipts',
    eventBusName: process.env.ORDER_EVENT_BUS ?? 'order-events-bus',
    orderQueueName: process.env.ORDER_QUEUE_NAME ?? 'order-events',
    orderDlqName: process.env.ORDER_DLQ_NAME ?? 'order-events-dlq',
    port: Number(process.env.PORT ?? 3000)
  };
}
