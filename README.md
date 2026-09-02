# Discord AI Bot

For the easiest local launch, follow [QUICK-START.md](QUICK-START.md) and double-click `START-BOT.bat`.

A white-themed Discord AI bot with slash commands, mention replies, per-channel memory, optional scheduled messages, and 25 standalone server modules.

## Features

- `/ask question:` asks the AI privately in the channel.
- Mention the bot to chat naturally.
- `/reset` clears the current channel's stored context.
- `/status` verifies the bot is online.
- White embeds keep the bot's visual identity clean and consistent.
- Optional cron-based daily check-in; Docker support for 24×7 hosting.
- Independent modules for tracking, automation, moderation, tickets, roles, welcome flows, embeds, leaderboards, giveaways, voice rooms, and utilities.

## Module commands

Each supplied command sheet is a dedicated slash-command module. Use the action from its sheet as the `action` field and any required text/ID as `value`, for example `/welcome action:on`, `/ticket action:panel`, or `/automod action:antispam value:enable`.

Module settings are saved per server in `data/module-config.json`; only members with **Manage Server** can change them.

## Setup

1. Create a Discord application and bot in the [Discord Developer Portal](https://discord.com/developers/applications). Enable **Message Content Intent** under Bot settings.
2. Copy `.env.example` to `.env`, then add your Discord bot token, application/client ID, and OpenAI API key. Never commit `.env`.
3. Run `npm install` and `npm start`.
4. Invite the bot with `bot` and `applications.commands` scopes. Grant it View Channels, Send Messages, Embed Links, Read Message History, and Use Application Commands.

For 24×7 operation, deploy the container to a persistent host such as Railway, Render, Fly.io, or a VPS. Keep the environment variables in the host's secret manager; the process must stay running for Discord gateway events.

`DISCORD_GUILD_ID` is optional but recommended during testing because server-specific slash-command changes show up quickly. Remove it for global commands once tested.

The bot uses the OpenAI Responses API through the official Node SDK. See the [OpenAI quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request) for API-key setup.
