import { Client, GatewayIntentBits } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";

const token = process.env.DISCORD_TOKEN!;

export const rest = new REST({ version: "10" }).setToken(token);

export const gateway = new WebSocketManager({
  rest,
  intents:
    GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent,
});
gateway.setToken(token);

export const client = new Client({ rest, gateway });
