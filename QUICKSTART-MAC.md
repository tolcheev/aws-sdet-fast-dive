# Quickstart For macOS

## 1. Install prerequisites

Install:

- Docker Desktop
- Node.js 20+

Check:

```bash
docker --version
node -v
npm -v
```

## 2. Unpack and enter project

```bash
unzip aws-sdet-fast-dive.zip
cd aws-sdet-fast-dive
```

## 3. Install dependencies

```bash
npm install
```

## 4. Start practice environment

```bash
bash scripts/mac/start.sh
```

Open:

```text
http://localhost:3000
```

## 5. Stop everything

Press `Ctrl+C` in the terminal where API is running, then:

```bash
bash scripts/mac/stop.sh
```
