# UKIYO DESIGN BOT

Admin-only Telegram publishing bot for UKIYO Studio. It creates retro/Y2K-style image cards or formatted Telegram text, previews the result, and can publish it to a configured channel.

## Requirements
- Node.js 20+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Two Telegram numeric user IDs
- A Telegram channel where the bot is an administrator with permission to post

## Setup
1. Create a bot with @BotFather and copy its token.
2. Copy `.env.example` to `.env`.
3. Fill in:
   - `BOT_TOKEN`
   - `ADMIN_IDS` (two numeric Telegram IDs, comma-separated)
   - `CHANNEL_ID` (for example `@ukiyo_studio` or the channel's numeric ID)
4. Add the bot to your channel as an administrator and enable posting messages.
5. Install and run:

```bash
npm install
npm start
```

6. Open your bot in Telegram and send `/start`.

## Finding admin IDs
1. Put the bot token in `.env`. You can leave the `ADMIN_IDS` placeholder as-is for the first launch.
2. Start the bot and send `/id` to it from each admin account.
3. Copy both numeric IDs into `ADMIN_IDS`, separated by a comma, then restart the bot. Until IDs are configured, no account can use the publishing menu.

## Features
- Admin allowlist (only configured numeric IDs can use it)
- Six publication categories: News, Services, Portfolio, Commissions, Community, Reviews
- Two output formats: generated PNG card or Telegram HTML text
- Editable title and body
- Preview before publishing
- Publish to configured Telegram channel

## Hosting
This bot uses Telegram long polling, so deploy it as a persistent Node.js worker on a host that supports always-on processes (for example Railway, Render Background Worker, or a VPS). Do not deploy this polling process as a standard short-lived serverless function.

## Security
- Never share `.env` or your bot token.
- If a token is exposed, revoke it with @BotFather and create a new one.
- Keep `ADMIN_IDS` restricted to trusted administrators.
