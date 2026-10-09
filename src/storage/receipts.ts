import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../aws/clients.js';
import { getConfig } from '../config.js';
import type { OrderItem } from '../orders/types.js';

const config = getConfig();

export type OrderReceipt = {
  orderId: string;
  customerId: string;
  pair: string;
  side: string;
  amount: number;
  status: 'PROCESSED';
  correlationId: string;
  processedAt: string;
};

export function receiptKeyForOrder(orderId: string): string {
  return `receipts/${orderId}.json`;
}

export async function putReceipt(order: OrderItem): Promise<string> {
  const key = receiptKeyForOrder(order.orderId);
  const receipt: OrderReceipt = {
    orderId: order.orderId,
    customerId: order.customerId,
    pair: order.pair,
    side: order.side,
    amount: order.amount,
    status: 'PROCESSED',
    correlationId: order.correlationId,
    processedAt: new Date().toISOString()
  };

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.receiptsBucket,
      Key: key,
      Body: JSON.stringify(receipt, null, 2),
      ContentType: 'application/json',
      Metadata: {
        correlationId: order.correlationId
      }
    })
  );

  return key;
}

export async function getReceiptJson(orderId: string): Promise<OrderReceipt> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: config.receiptsBucket,
      Key: receiptKeyForOrder(orderId)
    })
  );

  const body = await response.Body?.transformToString();
  if (!body) {
    throw new Error(`Receipt is empty for order ${orderId}`);
  }

  return JSON.parse(body) as OrderReceipt;
}

export async function getReceiptPresignedUrl(orderId: string): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: config.receiptsBucket,
      Key: receiptKeyForOrder(orderId)
    }),
    { expiresIn: 300 }
  );
}

export async function deleteAllReceipts(): Promise<void> {
  const listed = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: config.receiptsBucket
    })
  );

  const objects = listed.Contents?.map((object) => ({ Key: object.Key })).filter((object) => object.Key);
  if (!objects?.length) {
    return;
  }

  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: config.receiptsBucket,
      Delete: {
        Objects: objects
      }
    })
  );
}
