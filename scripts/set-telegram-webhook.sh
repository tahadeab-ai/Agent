#!/usr/bin/env bash
# ==============================================================================
# Script: Set Telegram Webhook to Production URL
# Usage: ./scripts/set-telegram-webhook.sh <BOT_TOKEN> <PRODUCTION_URL> <WEBHOOK_SECRET>
# Example: ./scripts/set-telegram-webhook.sh 123456:ABC-DEF https://my-agent.vercel.app secret123
# ==============================================================================

set -euo pipefail

BOT_TOKEN="${1:-${TELEGRAM_BOT_TOKEN:-}}"
PRODUCTION_URL="${2:-${NEXT_PUBLIC_APP_URL:-}}"
WEBHOOK_SECRET="${3:-${TELEGRAM_WEBHOOK_SECRET:-}}"

if [[ -z "$BOT_TOKEN" ]]; then
  echo "Error: TELEGRAM_BOT_TOKEN is required as arg 1 or environment variable."
  exit 1
fi

if [[ -z "$PRODUCTION_URL" ]]; then
  echo "Error: PRODUCTION_URL is required as arg 2 or environment variable NEXT_PUBLIC_APP_URL."
  exit 1
fi

WEBHOOK_URL="${PRODUCTION_URL%/}/api/telegram-webhook"

echo "Setting Telegram Webhook to: $WEBHOOK_URL"

if [[ -n "$WEBHOOK_SECRET" ]]; then
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"${WEBHOOK_URL}\", \"secret_token\": \"${WEBHOOK_SECRET}\"}" | grep --color=auto -E "ok\":true|description.*"
else
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"${WEBHOOK_URL}\"}" | grep --color=auto -E "ok\":true|description.*"
fi

echo ""
echo "Webhook configuration complete."
