import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import cron from "node-cron";
import OpenAI from "openai";
import { modules } from "./modules.js";
import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

const required = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID", "OPENAI_API_KEY"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const memoryPath = path.join("data", "memory.json");
const memory = fs.existsSync(memoryPath) ? JSON.parse(fs.readFileSync(memoryPath, "utf8")) : {};
const configPath = path.join("data", "module-config.json");
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : {};
const commands = [
  new SlashCommandBuilder().setName("ask").setDescription("Ask the AI bot").addStringOption((o) => o.setName("question").setDescription("What do you need?").setRequired(true)),
  new SlashCommandBuilder().setName("reset").setDescription("Clear this channel's AI memory"),
  new SlashCommandBuilder().setName("status").setDescription("Check bot status"),
  ...modules.map((module) => new SlashCommandBuilder()
    .setName(module.name)
    .setDescription(`Configure ${module.title}`)
    .addStringOption((o) => o.setName("action").setDescription("Action from the module command list").setRequired(true))
    .addStringOption((o) => o.setName("value").setDescription("Optional setting, text, user, channel, or role"))),
].map((command) => command.toJSON());

const whiteEmbed = (title, description) => new EmbedBuilder().setColor(0xffffff).setTitle(title).setDescription(description).setFooter({ text: "Discord AI Bot • Always on when hosted" });

function saveMemory() {
  fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

function saveConfig() {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function answer(channelId, prompt) {
  const history = memory[channelId] ?? [];
  const input = [
    { role: "system", content: "You are a helpful Discord assistant. Be clear, friendly, and concise. Never claim to perform actions you cannot actually perform." },
    ...history,
    { role: "user", content: prompt },
  ];
  const response = await ai.responses.create({ model: process.env.OPENAI_MODEL || "gpt-5", input });
  const text = response.output_text || "I couldn't generate a response just now.";
  memory[channelId] = [...history, { role: "user", content: prompt }, { role: "assistant", content: text }].slice(-12);
  saveMemory();
  return text;
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const route = process.env.DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)
    : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);
  await rest.put(route, { body: commands });
}

client.once(Events.ClientReady, async (ready) => {
  console.log(`Online as ${ready.user.tag}`);
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "status") return interaction.reply({ embeds: [whiteEmbed("Online", "AI, channel memory, slash commands, and scheduled tasks are ready.")], ephemeral: true });
  if (interaction.commandName === "reset") {
    delete memory[interaction.channelId]; saveMemory();
    return interaction.reply({ embeds: [whiteEmbed("Memory cleared", "This channel starts fresh from the next message.")], ephemeral: true });
  }
  const module = modules.find((entry) => entry.name === interaction.commandName);
  if (module) {
    if (!interaction.memberPermissions?.has("ManageGuild")) {
      return interaction.reply({ embeds: [whiteEmbed("Permission required", "Only members with **Manage Server** can configure modules.")], ephemeral: true });
    }
    const action = interaction.options.getString("action", true).trim().toLowerCase();
    const value = interaction.options.getString("value")?.trim() || "";
    if (!module.actions.includes(action)) {
      return interaction.reply({ embeds: [whiteEmbed("Unknown action", `Valid actions: ${module.actions.join(", ")}`)], ephemeral: true });
    }
    const guildConfig = config[interaction.guildId] ??= {};
    const moduleConfig = guildConfig[module.name] ??= {};
    moduleConfig[action] = { value, updatedAt: new Date().toISOString(), updatedBy: interaction.user.id };
    saveConfig();
    return interaction.reply({ embeds: [whiteEmbed(`${module.title} configured`, `**${action}** saved${value ? `: ${value}` : ""}.`)], ephemeral: true });
  }
  await interaction.deferReply();
  try {
    const text = await answer(interaction.channelId, interaction.options.getString("question", true));
    await interaction.editReply({ embeds: [whiteEmbed("Answer", text.slice(0, 4000))] });
  } catch (error) {
    console.error(error);
    await interaction.editReply({ embeds: [whiteEmbed("Temporarily unavailable", "The AI request failed. Please try again in a moment.")] });
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;
  const prompt = message.content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();
  if (!prompt) return;
  await message.channel.sendTyping();
  try { await message.reply({ embeds: [whiteEmbed("Answer", (await answer(message.channelId, prompt)).slice(0, 4000))] }); }
  catch (error) { console.error(error); await message.reply("I couldn't reach the AI service just now."); }
});

if (process.env.DAILY_BRIEF_CRON && process.env.DAILY_BRIEF_CHANNEL_ID) {
  cron.schedule(process.env.DAILY_BRIEF_CRON, async () => {
    const channel = await client.channels.fetch(process.env.DAILY_BRIEF_CHANNEL_ID);
    if (channel?.isTextBased()) await channel.send({ embeds: [whiteEmbed("Daily check-in", "I'm online. Use `/ask` or mention me whenever you need help.")] });
  });
}

client.login(process.env.DISCORD_TOKEN);
