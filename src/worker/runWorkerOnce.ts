import { DeleteMessageCommand, GetQueueUrlCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { sqsClient } from '../aws/clients.js';
import { getConfig } from '../config.js';
import type { OrderCreatedDetail } from '../events/orderEvents.js';
import { ORDER_CREATED_DETAIL_TYPE } from '../events/orderEvents.js';
import { logError, logInfo } from '../logging/logger.js';
import { processOrderCreated } from './orderHandler.js';

const config = getConfig();

type WorkerResult = {
  processed: number;
  failed: number;
};

type EventBridgeSqsEnvelope = {
  'detail-type'?: string;
  detail?: OrderCreatedDetail;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseOrderCreatedMessage(body: string | undefined): OrderCreatedDetail {
  if (!body) {
    throw new Error('SQS message has no body');
  }

  const envelope = JSON.parse(body) as EventBridgeSqsEnvelope;
  if (envelope['detail-type'] !== ORDER_CREATED_DETAIL_TYPE || !envelope.detail?.orderId) {
    throw new Error(`Unexpected event payload: ${body}`);
  }

  return envelope.detail;
}

export async function getOrderQueueUrl(): Promise<string> {
  const response = await sqsClient.send(
    new GetQueueUrlCommand({
      QueueName: config.orderQueueName
    })
  );

  if (!response.QueueUrl) {
    throw new Error(`Queue URL was not returned for ${config.orderQueueName}`);
  }

  return response.QueueUrl;
}

export async function runWorkerOnce(): Promise<WorkerResult> {
  const queueUrl = await getOrderQueueUrl();
  let messages: Message[] = [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
        MessageSystemAttributeNames: ['ApproximateReceiveCount']
      })
    );

    messages = response.Messages ?? [];
    if (messages.length > 0) {
      break;
    }

    await sleep(250);
  }

  let processed = 0;
  let failed = 0;

  for (const message of messages) {
    try {
      const detail = parseOrderCreatedMessage(message.Body);
      await processOrderCreated(detail);

      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle
        })
      );

      processed += 1;
    } catch (error) {
      failed += 1;
      logError('worker.message_failed', error, {
        messageId: message.MessageId,
        receiveCount: message.Attributes?.ApproximateReceiveCount
      });
    }
  }

  logInfo('worker.batch_finished', { processed, failed });
  return { processed, failed };
}
