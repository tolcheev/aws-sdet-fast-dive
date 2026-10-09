import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { bootstrapAwsResources } from '../../src/aws/bootstrap.js';
import { resetAwsResources } from '../../src/aws/reset.js';
import { createApp } from '../../src/api/app.js';
import { getOrderById } from '../../src/orders/orderRepository.js';
import { getReceiptJson } from '../../src/storage/receipts.js';
import { runWorkerOnce } from '../../src/worker/runWorkerOnce.js';

describe('local AWS order flow', () => {
  beforeAll(async () => {
    await bootstrapAwsResources();
  });

  beforeEach(async () => {
    await resetAwsResources();
  });

  it('creates an order through API, routes an EventBridge event to SQS, then the worker writes S3 receipt and updates DynamoDB', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/orders')
      .set('x-correlation-id', 'test-correlation-123')
      .send({
        customerId: 'client-42',
        pair: 'EUR/USD',
        side: 'BUY',
        amount: 1000
      })
      .expect(202);

    expect(response.body).toMatchObject({
      status: 'PENDING',
      correlationId: 'test-correlation-123'
    });
    expect(response.body.orderId).toEqual(expect.any(String));

    const pendingOrder = await getOrderById(response.body.orderId);
    expect(pendingOrder).toMatchObject({
      status: 'PENDING',
      customerId: 'client-42',
      pair: 'EUR/USD',
      side: 'BUY',
      amount: 1000,
      correlationId: 'test-correlation-123'
    });

    const workerResult = await runWorkerOnce();
    expect(workerResult).toEqual({ processed: 1, failed: 0 });

    const processedOrder = await getOrderById(response.body.orderId);
    expect(processedOrder).toMatchObject({
      status: 'PROCESSED',
      receiptKey: `receipts/${response.body.orderId}.json`
    });

    const receipt = await getReceiptJson(response.body.orderId);
    expect(receipt).toMatchObject({
      orderId: response.body.orderId,
      customerId: 'client-42',
      pair: 'EUR/USD',
      side: 'BUY',
      amount: 1000,
      correlationId: 'test-correlation-123'
    });
  });
});
