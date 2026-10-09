# AWS SDET Local Practice

Мини-проект для быстрой практики AWS-сценариев, которые часто всплывают на SDET / QA Automation собеседованиях: S3, SQS, EventBridge, DynamoDB, AWS SDK/CLI, correlation id, async-flow и DLQ.

Проект не требует реального AWS-аккаунта. Все ресурсы поднимаются локально в LocalStack. Архив можно давать ученикам и использовать как open-source материал по лицензии MIT.

## Для преподавателя

Если нужно отдать проект ученикам одним файлом:

```bash
npm run kit:build
```

Архив появится здесь:

```text
dist/aws-sdet-fast-dive.zip
```

Внутри есть:

- `STUDENT_GUIDE.md` — главный учебный гайд.
- `QUICKSTART-MAC.md` — запуск на macOS.
- `QUICKSTART-WINDOWS.md` — запуск на Windows PowerShell.
- `CASES.md` — практические кейсы.
- `scripts/mac/start.sh` и `scripts/windows/start.ps1` — быстрый старт.
- `scripts/mac/stop.sh` и `scripts/windows/stop.ps1` — остановка.

Перед публикацией проверьте архив:

```bash
unzip -t dist/aws-sdet-fast-dive.zip
unzip -l dist/aws-sdet-fast-dive.zip
```

В архиве не должно быть `.env`, `.localstack`, `node_modules`, `dist`, `.git` и системных файлов. Файл `.env.example` содержит только dummy credentials `test/test` для LocalStack.

## Что здесь собрано

Поток похож на типичный backend/integration кейс:

1. `POST /orders` принимает FX order.
2. API валидирует payload и пишет заказ в DynamoDB со статусом `PENDING`.
3. API публикует `OrderCreated` событие в EventBridge.
4. EventBridge rule маршрутизирует событие в SQS queue.
5. Локальный worker работает как Lambda-like consumer: читает SQS, обрабатывает событие, кладет receipt JSON в S3 и обновляет заказ в DynamoDB до `PROCESSED`.
6. Тест проверяет не только HTTP-ответ, но и side effects в DynamoDB, SQS/EventBridge и S3.

Это учебный стенд. IAM, VPC и CloudWatch здесь не “настоящие”, но код показывает места, где в реальном AWS появляются роли, permissions, приватные сети и логи.

## Быстрый старт

```bash
cp .env.example .env
npm install
docker compose up -d localstack
npm run aws:bootstrap
npm run test:unit
npm run test:integration
```

Если integration-тесты прошли, весь локальный AWS-flow работает.

## Самый простой способ посмотреть в браузере

```bash
cp .env.example .env
docker compose up -d localstack
npm run aws:bootstrap
npm run dev
```

Открой:

```text
http://localhost:3000
```

На странице есть две главные кнопки:

- `Create order` — отправляет `POST /orders`, пишет заказ в DynamoDB и публикует событие в EventBridge/SQS.
- `Run worker once` — читает одно сообщение из SQS, пишет receipt в S3 и меняет статус заказа на `PROCESSED`.

## Ручная практика

Терминал 1:

```bash
docker compose up -d localstack
npm run aws:bootstrap
npm run dev
```

Терминал 2:

```bash
curl -i -X POST http://localhost:3000/orders \
  -H "content-type: application/json" \
  -H "x-correlation-id: interview-demo-001" \
  -d '{"customerId":"client-42","pair":"EUR/USD","side":"BUY","amount":1000}'
```

Сохрани `orderId` из ответа.

Терминал 3, один проход worker:

```bash
npm run worker
```

`npm run worker` крутится бесконечно. Для остановки нажми `Ctrl+C`.

Проверить заказ:

```bash
curl http://localhost:3000/orders/<orderId>
```

Получить presigned URL на S3 receipt:

```bash
curl http://localhost:3000/orders/<orderId>/receipt-url
```

## AWS CLI без установленного aws CLI

На машине глобальный `aws` CLI может быть не установлен. В LocalStack контейнере обычно есть `awslocal`, поэтому можно тренироваться так:

```bash
docker compose exec localstack awslocal dynamodb scan --table-name orders
docker compose exec localstack awslocal s3 ls s3://order-receipts/receipts/
docker compose exec localstack awslocal sqs list-queues
docker compose exec localstack awslocal events list-rules --event-bus-name order-events-bus
```

Посмотреть сообщение в очереди до запуска worker:

```bash
docker compose exec localstack awslocal sqs receive-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-events
```

## DLQ-сценарий

Создай заказ, который специально ломает обработку:

```bash
curl -i -X POST http://localhost:3000/orders \
  -H "content-type: application/json" \
  -H "x-correlation-id: dlq-demo-001" \
  -d '{"customerId":"client-99","pair":"GBP/USD","side":"SELL","amount":500,"forceFailProcessing":true}'
```

Запусти worker несколько раз. Сообщение не удалится из основной очереди, после повторных receive попыток должно уйти в DLQ:

```bash
docker compose exec localstack awslocal sqs receive-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-events-dlq
```

Это показывает важную тему для SDET: retry, visibility timeout, failed message и dead-letter queue.

## Команды проекта

```bash
npm run dev              # Express API на localhost:3000
npm run worker           # бесконечный SQS consumer
npm run aws:bootstrap    # создать DynamoDB/S3/SQS/EventBridge ресурсы
npm run aws:reset        # очистить заказы, receipts и очереди
npm run test:unit        # быстрые unit-тесты без LocalStack
npm run test:integration # e2e через LocalStack
npm run typecheck        # TypeScript проверка
```

## Что говорить на собеседовании

Короткая формулировка:

> I practiced AWS from an SDET perspective using a local event-driven flow: API writes test data to DynamoDB, publishes an EventBridge event, SQS delivers it to a worker, and the test validates downstream side effects in S3 and DynamoDB using AWS SDK. I also checked correlation ids, retry/DLQ behavior and CLI inspection of AWS resources.

Технические темы, которые этот проект покрывает:

- AWS SDK clients, endpoint, region, credentials.
- DynamoDB table, item, key, scan/get/update, test data cleanup.
- S3 bucket/object/key, JSON receipt, presigned URL.
- EventBridge event bus, rule, target.
- SQS queue, receive/delete message, visibility timeout, DLQ.
- Lambda-like handler shape: event in, side effects out, logs by correlation id.
- CloudWatch mindset: локально логи идут в stdout, в AWS эти JSON-логи обычно ищут в CloudWatch Logs по `correlationId`.

## Чего здесь намеренно нет

- Реальный AWS IAM: LocalStack использует dummy credentials `test/test`.
- Реальная VPC/networking: локально это Docker port `4566`.
- Настоящая Lambda deployment: worker сделан локальным процессом, чтобы быстрее понять handler/trigger/retry без упаковки Lambda zip/container.
- RDS/EKS/ECS: для первой практики они менее важны, чем SDK + logs + async + state validation.

## Безопасность

- Не вставляйте в этот проект реальные `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, токены, пароли и SSH-ключи.
- Не коммитьте локальный `.env`: он добавлен в `.gitignore`.
- Для практики достаточно `.env.example`, где ключи равны `test/test`. LocalStack принимает их как заглушку.
- Если переносите проект в реальный AWS, создайте отдельный sandbox account, MFA, budget alert и роль с минимальными правами.
