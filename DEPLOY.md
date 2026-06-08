# Debate Fact Checker — eyesense deploy

Public URL: **https://debate.paperiq.ai**

Docker on the home server (eyesense), CloudFront terminates HTTPS and forwards to `edgewater.homeip.net:8912`.

## Ports

| Service | Host port |
|---------|-----------|
| debate-fact-checker web | **8912** |
| agent-forge web | 8911 |
| patent-researcher web | 8910 |

Forward **external TCP 8912** on your home router to the eyesense host.

## One-time server setup

```bash
ssh eyesense
git clone git@github.com:tguless/debate-fact-checker.git ~/debate-fact-checker
cd ~/debate-fact-checker
cp .env.example .env.local
# Edit .env.local — OPENAI_API_KEY + TAVILY_API_KEY required for /agent
```

Deploy can seed `OPENAI_*` from `~/patent-researcher/.env.local` if `.env.local` is missing.

## Deploy from laptop

```bash
cd debate-fact-checker
git add … && git commit … && git push origin main
./scripts/trigger-eyesense-deploy.sh
```

Or skip git check after push:

```bash
DEPLOY_SKIP_GIT_CHECK=1 ./scripts/trigger-eyesense-deploy.sh
```

## On-server redeploy

```bash
ssh eyesense 'cd ~/debate-fact-checker && ./redeploy.sh'
```

## Terraform (CloudFront + DNS)

From the **llm-ocr** repo:

```bash
cd terraform
terraform plan   # debate-fact-checker-home-cloudfront.tf
terraform apply
```

Uses existing `*.paperiq.ai` ACM certificate.

## Health checks

```bash
./scripts/eyesense-status.sh
./scripts/eyesense-logs.sh 100
curl -sI https://debate.paperiq.ai/
```

## Open Graph banner

Social preview: `web/public/og-image.png`. Regenerate from llm-ocr repo root:

```bash
node scripts/generate-og-image.mjs \
  --slug debate-fact-checker \
  --output terraform/debate-fact-checker/web/public/og-image.png \
  --title "Debate Fact Checker" \
  --subtitle "Gish Gallop & firehose rhetoric analysis" \
  --tagline "Paste a YouTube debate. Get citeable receipts." \
  --accent "#f97316"
```

Commit and redeploy for CloudFront to serve the new preview.

## Database

Production uses Postgres in Docker (`dfc-postgres` volume). Schema sync runs `prisma db push` on each deploy.
