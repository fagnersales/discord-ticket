import { GatewayDispatchEvents, InteractionType, MessageFlags, Routes } from "@discordjs/core";
import { client, gateway, rest } from "./client";
import { pingCommand } from "./commands/ping";

const commands = [pingCommand];

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
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (!("name" in interaction.data)) return;

  if (interaction.data.name === "ping") {
    await api.interactions.reply(interaction.id, interaction.token, {
      content: "Pong!",
      flags: MessageFlags.Ephemeral,
    });
  }
});

gateway.connect();

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await gateway.destroy();
  process.exit(0);
});
