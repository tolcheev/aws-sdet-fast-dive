import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '../config.js';

const config = getConfig();

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test'
};

const baseClientConfig = {
  region: config.region,
  endpoint: config.endpointUrl,
  credentials
};

export const dynamoDbClient = new DynamoDBClient(baseClientConfig);

export const documentClient = DynamoDBDocumentClient.from(dynamoDbClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

export const eventBridgeClient = new EventBridgeClient(baseClientConfig);
export const sqsClient = new SQSClient(baseClientConfig);

export const s3Client = new S3Client({
  ...baseClientConfig,
  forcePathStyle: true
});
