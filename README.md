# DisputeAnalysis AI Telegram Bot

Thin Telegram connector for the existing DisputeAnalysis AI backend.

## Responsibilities

- Receive Telegram updates the bot is allowed to see
- Normalize Telegram messages
- Send messages to the backend conversation API
- Poll bounded async analysis jobs
- Return concise replies to Telegram users

It does not perform AI reasoning locally.

## Commands

- `/help`
- `/summary`
- `/analyze`
- `/analyze_time 2h`
- `/analyze_range <start-link> <end-link>`
- `/analyze_message`
- `/analyze_image`
- `/analyze_reply`

Mention examples:

- `@JudgeBot summarize last 2 hours`
- `@JudgeBot what happened here?`
- `@JudgeBot analyze this`

## Safety Model

- Ignores bot-authored messages
- Maintains a bounded per-chat message cache
- Uses bounded backend polling
- Uses scoped, expiring upload sessions keyed by `chatId:userId`
- Cleans processing indicators in `finally`
- Never claims access to messages the bot has not received

## Local Setup

1. Copy `.env.example` to `.env`
2. Set `BOT_TOKEN`, `BACKEND_BASE_URL`, and `BACKEND_API_KEY`
3. Run `npm install`
4. Run `npm start`

## Telegram Notes

For group-wide analysis, the bot must be present in the chat and configured so it receives the relevant messages. Time-range and message-range analysis operate over the connector's own bounded cache of received updates.
