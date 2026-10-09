import { randomUUID } from 'node:crypto';
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { documentClient } from '../aws/clients.js';
import { getConfig } from '../config.js';
import type { CreateOrderInput, OrderItem } from './types.js';

const config = getConfig();

export async function createPendingOrder(input: CreateOrderInput, correlationId: string): Promise<OrderItem> {
  const now = new Date().toISOString();
  const order: OrderItem = {
    orderId: `ord_${randomUUID()}`,
    customerId: input.customerId,
    pair: input.pair,
    side: input.side,
    amount: input.amount,
    status: 'PENDING',
    correlationId,
    createdAt: now,
    updatedAt: now,
    forceFailProcessing: input.forceFailProcessing
  };

  await documentClient.send(
    new PutCommand({
      TableName: config.ordersTable,
      Item: order,
      ConditionExpression: 'attribute_not_exists(orderId)'
    })
  );

  return order;
}

export async function getOrderById(orderId: string): Promise<OrderItem | undefined> {
  const response = await documentClient.send(
    new GetCommand({
      TableName: config.ordersTable,
      Key: { orderId }
    })
  );

  return response.Item as OrderItem | undefined;
}

export async function markOrderProcessed(orderId: string, receiptKey: string): Promise<OrderItem> {
  const response = await documentClient.send(
    new UpdateCommand({
      TableName: config.ordersTable,
      Key: { orderId },
      UpdateExpression: 'SET #status = :status, receiptKey = :receiptKey, updatedAt = :updatedAt',
      ConditionExpression: 'attribute_exists(orderId)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'PROCESSED',
        ':receiptKey': receiptKey,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  return response.Attributes as OrderItem;
}

export async function listOrders(): Promise<OrderItem[]> {
  const response = await documentClient.send(
    new ScanCommand({
      TableName: config.ordersTable
    })
  );

  return (response.Items ?? []) as OrderItem[];
}

export async function deleteOrder(orderId: string): Promise<void> {
  await documentClient.send(
    new DeleteCommand({
      TableName: config.ordersTable,
      Key: { orderId }
    })
  );
}
