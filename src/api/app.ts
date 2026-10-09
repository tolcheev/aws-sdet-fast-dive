import express from 'express';
import { randomUUID } from 'node:crypto';
import { renderDemoPage } from './demoPage.js';
import { publishOrderCreated } from '../events/orderEvents.js';
import { logError, logInfo } from '../logging/logger.js';
import { parseCreateOrderInput } from '../orders/orderInput.js';
import { createPendingOrder, getOrderById, listOrders } from '../orders/orderRepository.js';
import { getReceiptJson, getReceiptPresignedUrl } from '../storage/receipts.js';
import { runWorkerOnce } from '../worker/runWorkerOnce.js';

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/', (_request, response) => {
    response.type('html').send(renderDemoPage());
  });

  app.get('/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.post('/orders', async (request, response) => {
    const correlationId = request.header('x-correlation-id') ?? randomUUID();

    try {
      const input = parseCreateOrderInput(request.body);
      const order = await createPendingOrder(input, correlationId);
      await publishOrderCreated(order);

      logInfo('api.order_created', {
        orderId: order.orderId,
        correlationId
      });

      response.status(202).json({
        orderId: order.orderId,
        status: order.status,
        correlationId
      });
    } catch (error) {
      logError('api.order_create_failed', error, { correlationId });

      if (error instanceof Error && error.message.toLowerCase().includes('invalid order payload')) {
        response.status(400).json({
          error: error.message,
          correlationId
        });
        return;
      }

      response.status(500).json({
        error: 'Unexpected order creation failure',
        correlationId
      });
    }
  });

  app.get('/orders/:orderId', async (request, response) => {
    const order = await getOrderById(request.params.orderId);
    if (!order) {
      response.status(404).json({ error: 'Order not found' });
      return;
    }

    response.json(order);
  });

  app.get('/orders/:orderId/receipt-url', async (request, response) => {
    const order = await getOrderById(request.params.orderId);
    if (!order) {
      response.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'PROCESSED' || !order.receiptKey) {
      response.status(409).json({ error: 'Receipt is not ready yet' });
      return;
    }

    response.json({
      orderId: order.orderId,
      receiptKey: order.receiptKey,
      expiresInSeconds: 300,
      url: await getReceiptPresignedUrl(order.orderId)
    });
  });

  app.get('/dev/state', async (_request, response) => {
    const orders = await listOrders();
    const processedOrders = orders.filter((order) => order.status === 'PROCESSED');
    const receipts = await Promise.all(
      processedOrders.map(async (order) => ({
        key: order.receiptKey,
        body: await getReceiptJson(order.orderId)
      }))
    );

    response.json({ orders, receipts });
  });

  app.post('/dev/process-next', async (_request, response) => {
    response.json(await runWorkerOnce());
  });

  return app;
}
