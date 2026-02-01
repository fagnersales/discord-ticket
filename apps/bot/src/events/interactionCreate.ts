import { GatewayDispatchEvents, InteractionType, MessageFlags, type APIInteraction, type API } from "@discordjs/core";

export async function handleInteractionCreate(interaction: APIInteraction, api: API) {
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (!("name" in interaction.data)) return;

  switch (interaction.data.name) {
    case "ping":
      await api.interactions.reply(interaction.id, interaction.token, {
        content: "Pong!",
        flags: MessageFlags.Ephemeral,
      });
      break;
  }
}
