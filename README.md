# Intel Refinery Telegram Bot

OTP-only Telegram connector for Intel Refinery web login.

## Responsibility

- Respond to `/otp` in a private Telegram chat
- Request a short-lived login code from the Intel Refinery API
- Publish only the `/otp` command to Telegram

The bot only returns login codes.

## Command

- `/otp` - get a one-time Intel Refinery login code

## Local Setup

1. Copy `.env.example` to `.env`
2. Set `BOT_TOKEN`, `BOT_USERNAME`, `BACKEND_BASE_URL`, `BACKEND_API_KEY`, and `BACKEND_ADMIN_TOKEN`
3. Run `npm install`
4. Run `npm start`

## Production Bot

Telegram: https://t.me/intel_refinery_bot
