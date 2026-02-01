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

gateway.connect();

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await gateway.destroy();
  process.exit(0);
});
