# Quickstart For Windows

## 1. Install prerequisites

Install:

- Docker Desktop for Windows
- Node.js 20+
- PowerShell 5+ or PowerShell 7+

Check in PowerShell:

```powershell
docker --version
node -v
npm -v
```

## 2. Unpack and enter project

Right-click `aws-sdet-fast-dive.zip`, choose `Extract All`, then open PowerShell in the extracted folder.

## 3. Install dependencies

```powershell
npm install
```

## 4. Start practice environment

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\start.ps1
```

Open:

```text
http://localhost:3000
```

## 5. Stop everything

Press `Ctrl+C` in the terminal where API is running, then:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\stop.ps1
```
