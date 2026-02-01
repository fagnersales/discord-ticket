import { GatewayDispatchEvents, Routes } from "@discordjs/core";
import { client, gateway, rest } from "./client";

// Commands
import { pingCommand } from "./commands/ping";
import { ticketCommand } from "./commands/ticket";
import { panelCommand } from "./commands/panel";
import { settingsCommand } from "./commands/settings";

// Event handlers
import { handleInteractionCreate } from "./events/interactionCreate";
import { handleMessageCreate } from "./events/messageCreate";
import { handleMessageUpdate } from "./events/messageUpdate";
import { handleMessageDelete } from "./events/messageDelete";
import { handleChannelDelete } from "./events/channelDelete";
import { handleGuildCreate } from "./events/guildCreate";
import { handleChannelCreate } from "./events/channelCreate";
import { handleChannelUpdate } from "./events/channelUpdate";
import { handleRoleCreate } from "./events/roleCreate";
import { handleRoleUpdate } from "./events/roleUpdate";
import { handleRoleDelete } from "./events/roleDelete";
import { handleGuildMemberAdd } from "./events/guildMemberAdd";
import { handleGuildMemberUpdate } from "./events/guildMemberUpdate";
import { handleGuildMemberRemove } from "./events/guildMemberRemove";
import { handleGuildEmojisUpdate } from "./events/guildEmojisUpdate";

const commands = [pingCommand, ticketCommand, panelCommand, settingsCommand];

async function deployCommands() {
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  if (!applicationId) {
    console.error("Missing DISCORD_APPLICATION_ID");
    return;
  }

  try {
    await rest.put(Routes.applicationCommands(applicationId), { body: commands });
    console.log(`Deployed ${commands.length} command(s)`);
  } catch (error) {
    console.error("Failed to deploy commands:", error);
  }
}

client.on(GatewayDispatchEvents.Ready, async ({ data }) => {
  console.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
  await deployCommands();
});

client.on(GatewayDispatchEvents.InteractionCreate, async ({ data: interaction, api }) => {
  try {
    await handleInteractionCreate(interaction, api);
  } catch (error) {
    console.error("Error handling interaction:", error);
  }
});

client.on(GatewayDispatchEvents.MessageCreate, async ({ data: message }) => {
  try {
    await handleMessageCreate(message);
  } catch (error) {
    console.error("Error handling message create:", error);
  }
});

client.on(GatewayDispatchEvents.MessageUpdate, async ({ data: message }) => {
  try {
    // MessageUpdate can have partial data, so we need to check for required fields
    if (message.author && message.content !== undefined) {
      await handleMessageUpdate(message as any);
    }
  } catch (error) {
    console.error("Error handling message update:", error);
  }
});

client.on(GatewayDispatchEvents.MessageDelete, async ({ data }) => {
  try {
    await handleMessageDelete(data);
  } catch (error) {
    console.error("Error handling message delete:", error);
  }
});

client.on(GatewayDispatchEvents.ChannelDelete, async ({ data }) => {
  try {
    await handleChannelDelete(data);
  } catch (error) {
    console.error("Error handling channel delete:", error);
  }
});

// Discord sync event handlers
client.on(GatewayDispatchEvents.GuildCreate, async ({ data }) => {
  try {
    await handleGuildCreate(data);
  } catch (error) {
    console.error("Error handling guild create:", error);
  }
});

client.on(GatewayDispatchEvents.ChannelCreate, async ({ data }) => {
  try {
    await handleChannelCreate(data);
  } catch (error) {
    console.error("Error handling channel create:", error);
  }
});

client.on(GatewayDispatchEvents.ChannelUpdate, async ({ data }) => {
  try {
    await handleChannelUpdate(data);
  } catch (error) {
    console.error("Error handling channel update:", error);
  }
});

client.on(GatewayDispatchEvents.GuildRoleCreate, async ({ data }) => {
  try {
    await handleRoleCreate(data);
  } catch (error) {
    console.error("Error handling role create:", error);
  }
});

client.on(GatewayDispatchEvents.GuildRoleUpdate, async ({ data }) => {
  try {
    await handleRoleUpdate(data);
  } catch (error) {
    console.error("Error handling role update:", error);
  }
});

client.on(GatewayDispatchEvents.GuildRoleDelete, async ({ data }) => {
  try {
    await handleRoleDelete(data);
  } catch (error) {
    console.error("Error handling role delete:", error);
  }
});

client.on(GatewayDispatchEvents.GuildMemberAdd, async ({ data }) => {
  try {
    await handleGuildMemberAdd(data);
  } catch (error) {
    console.error("Error handling member add:", error);
  }
});

client.on(GatewayDispatchEvents.GuildMemberUpdate, async ({ data }) => {
  try {
    await handleGuildMemberUpdate(data);
  } catch (error) {
    console.error("Error handling member update:", error);
  }
});

client.on(GatewayDispatchEvents.GuildMemberRemove, async ({ data }) => {
  try {
    await handleGuildMemberRemove(data);
  } catch (error) {
    console.error("Error handling member remove:", error);
  }
});

client.on(GatewayDispatchEvents.GuildEmojisUpdate, async ({ data }) => {
  try {
    await handleGuildEmojisUpdate(data);
  } catch (error) {
    console.error("Error handling emojis update:", error);
  }
});

gateway.connect();

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await gateway.destroy();
  process.exit(0);
});
