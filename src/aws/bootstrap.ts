import {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists
} from '@aws-sdk/client-dynamodb';
import {
  CreateEventBusCommand,
  PutRuleCommand,
  PutTargetsCommand
} from '@aws-sdk/client-eventbridge';
import {
  CreateBucketCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  SetQueueAttributesCommand
} from '@aws-sdk/client-sqs';
import { dynamoDbClient, eventBridgeClient, s3Client, sqsClient } from './clients.js';
import { getConfig } from '../config.js';
import { ORDER_CREATED_DETAIL_TYPE, ORDER_EVENT_SOURCE } from '../events/orderEvents.js';
import { logError, logInfo } from '../logging/logger.js';

const config = getConfig();
const ruleName = 'order-created-to-sqs';

function hasErrorName(error: unknown, names: string[]): boolean {
  return error instanceof Error && names.includes(error.name);
}

async function ensureOrdersTable(): Promise<void> {
  try {
    await dynamoDbClient.send(
      new DescribeTableCommand({
        TableName: config.ordersTable
      })
    );
    logInfo('bootstrap.dynamodb_exists', { table: config.ordersTable });
    return;
  } catch (error) {
    if (!hasErrorName(error, ['ResourceNotFoundException'])) {
      throw error;
    }
  }

  await dynamoDbClient.send(
    new CreateTableCommand({
      TableName: config.ordersTable,
      AttributeDefinitions: [
        {
          AttributeName: 'orderId',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'orderId',
          KeyType: 'HASH'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    })
  );

  await waitUntilTableExists(
    {
      client: dynamoDbClient,
      minDelay: 1,
      maxWaitTime: 20
    },
    {
      TableName: config.ordersTable
    }
  );

  logInfo('bootstrap.dynamodb_created', { table: config.ordersTable });
}

async function ensureBucket(): Promise<void> {
  try {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: config.receiptsBucket
      })
    );
    logInfo('bootstrap.s3_bucket_exists', { bucket: config.receiptsBucket });
    return;
  } catch (error) {
    if (!hasErrorName(error, ['NotFound', 'NoSuchBucket', 'UnknownError', 'Forbidden'])) {
      throw error;
    }
  }

  await s3Client.send(
    new CreateBucketCommand({
      Bucket: config.receiptsBucket
    })
  );

  logInfo('bootstrap.s3_bucket_created', { bucket: config.receiptsBucket });
}

async function getQueueUrl(queueName: string): Promise<string | undefined> {
  try {
    const response = await sqsClient.send(
      new GetQueueUrlCommand({
        QueueName: queueName
      })
    );
    return response.QueueUrl;
  } catch (error) {
    if (hasErrorName(error, ['QueueDoesNotExist', 'AWS.SimpleQueueService.NonExistentQueue'])) {
      return undefined;
    }
    throw error;
  }
}

async function ensureQueue(queueName: string, attributes: Record<string, string>): Promise<string> {
  const existingUrl = await getQueueUrl(queueName);
  if (existingUrl) {
    await sqsClient.send(
      new SetQueueAttributesCommand({
        QueueUrl: existingUrl,
        Attributes: attributes
      })
    );
    logInfo('bootstrap.sqs_queue_exists', { queue: queueName });
    return existingUrl;
  }

  const response = await sqsClient.send(
    new CreateQueueCommand({
      QueueName: queueName,
      Attributes: attributes
    })
  );

  if (!response.QueueUrl) {
    throw new Error(`Queue URL was not returned for ${queueName}`);
  }

  logInfo('bootstrap.sqs_queue_created', { queue: queueName });
  return response.QueueUrl;
}

async function getQueueArn(queueUrl: string): Promise<string> {
  const response = await sqsClient.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn']
    })
  );

  const arn = response.Attributes?.QueueArn;
  if (!arn) {
    throw new Error(`QueueArn was not returned for ${queueUrl}`);
  }

  return arn;
}

async function ensureQueues(): Promise<string> {
  const dlqUrl = await ensureQueue(config.orderDlqName, {
    MessageRetentionPeriod: '1209600',
    VisibilityTimeout: '1'
  });
  const dlqArn = await getQueueArn(dlqUrl);

  const queueUrl = await ensureQueue(config.orderQueueName, {
    MessageRetentionPeriod: '1209600',
    VisibilityTimeout: '1',
    RedrivePolicy: JSON.stringify({
      deadLetterTargetArn: dlqArn,
      maxReceiveCount: 2
    })
  });
  const queueArn = await getQueueArn(queueUrl);

  await sqsClient.send(
    new SetQueueAttributesCommand({
      QueueUrl: queueUrl,
      Attributes: {
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com'
              },
              Action: 'sqs:SendMessage',
              Resource: queueArn
            }
          ]
        })
      }
    })
  );

  return queueArn;
}

async function ensureEventBridge(queueArn: string): Promise<void> {
  try {
    await eventBridgeClient.send(
      new CreateEventBusCommand({
        Name: config.eventBusName
      })
    );
    logInfo('bootstrap.event_bus_created', { eventBus: config.eventBusName });
  } catch (error) {
    if (!hasErrorName(error, ['ResourceAlreadyExistsException'])) {
      throw error;
    }
    logInfo('bootstrap.event_bus_exists', { eventBus: config.eventBusName });
  }

  const rule = await eventBridgeClient.send(
    new PutRuleCommand({
      EventBusName: config.eventBusName,
      Name: ruleName,
      EventPattern: JSON.stringify({
        source: [ORDER_EVENT_SOURCE],
        'detail-type': [ORDER_CREATED_DETAIL_TYPE]
      }),
      State: 'ENABLED'
    })
  );

  await eventBridgeClient.send(
    new PutTargetsCommand({
      EventBusName: config.eventBusName,
      Rule: ruleName,
      Targets: [
        {
          Id: 'order-events-sqs-target',
          Arn: queueArn
        }
      ]
    })
  );

  logInfo('bootstrap.event_rule_ready', {
    eventBus: config.eventBusName,
    ruleArn: rule.RuleArn,
    targetArn: queueArn
  });
}

export async function bootstrapAwsResources(): Promise<void> {
  await ensureOrdersTable();
  await ensureBucket();
  const queueArn = await ensureQueues();
  await ensureEventBridge(queueArn);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrapAwsResources().catch((error) => {
    logError('bootstrap.failed', error);
    process.exitCode = 1;
  });
}
