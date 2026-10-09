import { GetQueueUrlCommand, PurgeQueueCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from './clients.js';
import { bootstrapAwsResources } from './bootstrap.js';
import { getConfig } from '../config.js';
import { logError, logInfo } from '../logging/logger.js';
import { deleteOrder, listOrders } from '../orders/orderRepository.js';
import { deleteAllReceipts } from '../storage/receipts.js';

const config = getConfig();

async function purgeQueue(queueName: string): Promise<void> {
  try {
    const response = await sqsClient.send(
      new GetQueueUrlCommand({
        QueueName: queueName
      })
    );

    await sqsClient.send(
      new PurgeQueueCommand({
        QueueUrl: response.QueueUrl
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name.includes('PurgeQueueInProgress')) {
      return;
    }
    throw error;
  }
}

export async function resetAwsResources(): Promise<void> {
  await bootstrapAwsResources();

  const orders = await listOrders();
  await Promise.all(orders.map((order) => deleteOrder(order.orderId)));
  await deleteAllReceipts();
  await purgeQueue(config.orderQueueName);
  await purgeQueue(config.orderDlqName);

  logInfo('reset.finished', {
    deletedOrders: orders.length
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  resetAwsResources().catch((error) => {
    logError('reset.failed', error);
    process.exitCode = 1;
  });
}
