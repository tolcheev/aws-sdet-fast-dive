# AWS SDET Fast Dive

Цель: за 30-45 минут руками пройти один cloud/backend сценарий и понять, как SDET проверяет AWS-интеграции без реального AWS-аккаунта.

Все запускается локально через Docker + LocalStack. LocalStack имитирует AWS-сервисы на твоем компьютере.

Реальный AWS-аккаунт не нужен. В проекте используются dummy credentials `test/test`, они работают только с LocalStack.

## Что получится увидеть

Сценарий:

```text
Browser
  -> API
  -> DynamoDB
  -> EventBridge
  -> SQS
  -> Worker
  -> S3
  -> DynamoDB
```

По-человечески:

1. Браузер отправляет заказ.
2. API сохраняет заказ в DynamoDB со статусом `PENDING`.
3. API публикует событие `OrderCreated`.
4. EventBridge кладет событие в SQS queue.
5. Worker забирает сообщение из SQS.
6. Worker кладет receipt JSON в S3.
7. Worker меняет статус заказа в DynamoDB на `PROCESSED`.

## Что здесь как называется в реальной работе

| В проекте | В AWS | Как это понимать SDET |
|---|---|---|
| Browser page | frontend/client | Откуда приходит пользовательский action |
| Express API | backend service | Сервис, который принимает запрос |
| DynamoDB | NoSQL database | Где лежит состояние заказа |
| EventBridge | event router | Сервис, который маршрутизирует события |
| SQS | queue | Очередь задач для async processing |
| Worker | Lambda/consumer | Код, который обрабатывает сообщение |
| S3 | object storage | Файловое хранилище для receipt |
| stdout logs | CloudWatch-like logs | Где искать `correlationId` и ошибки |

## Перед стартом

Нужно установить:

- Docker Desktop
- Node.js 20 или новее
- Git, если хочешь распаковывать/смотреть проект как репозиторий

AWS CLI не нужен. Для AWS CLI-практики используется `awslocal` внутри Docker-контейнера.

## Быстрый старт на macOS

```bash
unzip aws-sdet-fast-dive.zip
cd aws-sdet-fast-dive
cp .env.example .env
npm install
bash scripts/mac/start.sh
```

Открой:

```text
http://localhost:3000
```

Остановить:

```bash
bash scripts/mac/stop.sh
```

## Быстрый старт на Windows PowerShell

Распакуй `aws-sdet-fast-dive.zip`, открой PowerShell в папке проекта и выполни:

```powershell
Copy-Item .env.example .env
npm install
powershell -ExecutionPolicy Bypass -File .\scripts\windows\start.ps1
```

Открой:

```text
http://localhost:3000
```

Остановить:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\stop.ps1
```

## Главный учебный сценарий

1. Открой `http://localhost:3000`.
2. Нажми `Create order`.
3. Посмотри блок `DynamoDB`: заказ появился со статусом `PENDING`.
4. Нажми `Run worker once`.
5. Посмотри блок `DynamoDB`: статус стал `PROCESSED`.
6. Посмотри блок `S3`: появился receipt-файл.

Это и есть SDET-проверка async cloud flow: не только HTTP response, но и состояние downstream-сервисов.

## Что сказать на собеседовании

Коротко:

> I practiced AWS from an SDET perspective using a local event-driven flow: API writes an order to DynamoDB, publishes an EventBridge event, SQS delivers it to a worker, and tests validate downstream side effects in S3 and DynamoDB using AWS SDK.

Чуть подробнее:

> I understand how to test async AWS workflows: create test data through API, use correlation ids, verify queue-driven processing, check database state and S3 objects, and debug failures through logs and IAM/access assumptions.

## Если что-то не работает

Проверь, что `.env` создан из `.env.example`. Реальные AWS-ключи сюда вставлять не нужно.

Проверь Docker:

```bash
docker info
```

Проверь LocalStack:

```bash
docker compose ps
```

Проверь API:

```bash
curl http://localhost:3000/health
```

Если порт `3000` занят, останови старый процесс или измени `PORT` в `.env`.
