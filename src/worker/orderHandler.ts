import type { OrderCreatedDetail } from '../events/orderEvents.js';
import { logInfo } from '../logging/logger.js';
import { getOrderById, markOrderProcessed } from '../orders/orderRepository.js';
import { putReceipt } from '../storage/receipts.js';

export async function processOrderCreated(detail: OrderCreatedDetail): Promise<void> {
  const order = await getOrderById(detail.orderId);
  if (!order) {
    throw new Error(`Order ${detail.orderId} was not found`);
  }

  if (order.status === 'PROCESSED' && order.receiptKey) {
    logInfo('worker.order_already_processed', {
      orderId: order.orderId,
      correlationId: detail.correlationId,
      receiptKey: order.receiptKey
    });
    return;
  }

  if (detail.forceFailProcessing) {
    throw new Error(`Forced processing failure for order ${detail.orderId}`);
  }

  const receiptKey = await putReceipt(order);
  await markOrderProcessed(order.orderId, receiptKey);

  logInfo('worker.order_processed', {
    orderId: order.orderId,
    correlationId: detail.correlationId,
    receiptKey
  });
}
