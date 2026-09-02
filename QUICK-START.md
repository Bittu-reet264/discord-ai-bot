# One-click Discord bot launch

1. Install Node.js LTS once: https://nodejs.org/
2. Double-click `START-BOT.bat`.
3. On its first run, it opens `.env`. Paste these four values, save, and close Notepad:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_test_server_id
OPENAI_API_KEY=your_openai_api_key
```

4. Double-click `START-BOT.bat` again. The script installs packages automatically and starts the bot.

## Get the three Discord values

Open https://discord.com/developers/applications, create an application, then create a Bot:

- **DISCORD_TOKEN**: Bot page → Reset Token → copy it. Keep it private.
- **DISCORD_CLIENT_ID**: General Information → Application ID.
- **DISCORD_GUILD_ID**: Discord Settings → Advanced → enable Developer Mode → right-click your test server → Copy Server ID.

In the Bot page, enable **Message Content Intent**. In OAuth2 → URL Generator, select `bot` and `applications.commands`, then open the generated link to invite the bot.

Keep the window open while using the bot. For 24×7 operation, deploy this same folder to a host such as Railway, Render, Fly.io, or a VPS and add the same environment variables there.
