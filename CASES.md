# Practice Cases

## Case 1: Happy Path

Цель: понять основной AWS flow.

1. Открой `http://localhost:3000`.
2. Нажми `Create order`.
3. Найди заказ в блоке `DynamoDB`.
4. Убедись, что статус `PENDING`.
5. Нажми `Run worker once`.
6. Убедись, что статус стал `PROCESSED`.
7. Убедись, что в блоке `S3` появился receipt.

Что это проверяет:

- API создал заказ.
- DynamoDB хранит состояние.
- EventBridge отправил событие.
- SQS доставил задачу worker-у.
- Worker сделал side effect в S3.

## Case 2: Inspect AWS Resources Like SDET

Цель: посмотреть AWS-состояние не через UI, а через CLI.

Список очередей:

```bash
docker compose exec localstack awslocal sqs list-queues
```

Содержимое DynamoDB:

```bash
docker compose exec localstack awslocal dynamodb scan --table-name orders
```

Файлы в S3:

```bash
docker compose exec localstack awslocal s3 ls s3://order-receipts/receipts/
```

EventBridge rules:

```bash
docker compose exec localstack awslocal events list-rules --event-bus-name order-events-bus
```

Что это тренирует:

- Не верить только UI.
- Проверять фактическое состояние cloud-ресурсов.
- Мыслить как SDET для backend/integration testing.

## Case 3: Failed Message And DLQ

Цель: понять retry/DLQ идею.

Создай заказ с forced failure через терминал:

```bash
curl -i -X POST http://localhost:3000/orders \
  -H "content-type: application/json" \
  -H "x-correlation-id: dlq-demo-001" \
  -d '{"customerId":"client-99","pair":"GBP/USD","side":"SELL","amount":500,"forceFailProcessing":true}'
```

Запусти worker несколько раз:

```bash
curl -X POST http://localhost:3000/dev/process-next
curl -X POST http://localhost:3000/dev/process-next
curl -X POST http://localhost:3000/dev/process-next
```

Проверь DLQ:

```bash
docker compose exec localstack awslocal sqs receive-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-events-dlq
```

Что это тренирует:

- Сообщение может не обработаться.
- Worker не удаляет failed message.
- После retry сообщение уходит в dead-letter queue.
- SDET должен уметь проверять не только happy path.

## Case 4: Automated Test

Цель: увидеть, как это проверяется автотестом.

```bash
npm run test:integration
```

Тест делает то же самое, что ты делал руками:

1. Создает заказ через API.
2. Проверяет `PENDING` в DynamoDB.
3. Запускает worker.
4. Проверяет `PROCESSED` в DynamoDB.
5. Проверяет receipt JSON в S3.

Файл теста:

```text
tests/integration/orderFlow.e2e.test.ts
```
