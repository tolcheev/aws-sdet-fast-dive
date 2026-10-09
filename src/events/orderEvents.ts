import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { eventBridgeClient } from '../aws/clients.js';
import { getConfig } from '../config.js';
import type { OrderItem } from '../orders/types.js';

const config = getConfig();

export const ORDER_EVENT_SOURCE = 'aws-sdet.practice';
export const ORDER_CREATED_DETAIL_TYPE = 'OrderCreated';

export type OrderCreatedDetail = {
  orderId: string;
  correlationId: string;
  forceFailProcessing: boolean;
};

export async function publishOrderCreated(order: OrderItem): Promise<void> {
  const response = await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.eventBusName,
          Source: ORDER_EVENT_SOURCE,
          DetailType: ORDER_CREATED_DETAIL_TYPE,
          Detail: JSON.stringify({
            orderId: order.orderId,
            correlationId: order.correlationId,
            forceFailProcessing: order.forceFailProcessing
          } satisfies OrderCreatedDetail)
        }
      ]
    })
  );

  if ((response.FailedEntryCount ?? 0) > 0) {
    throw new Error(`Failed to publish order event: ${JSON.stringify(response.Entries)}`);
  }
}
