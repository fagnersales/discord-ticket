import {
  MessageFlags,
  Routes,
  type API,
  type APIGuild,
  type APIModalSubmitInteraction,
  type APIUser,
} from "@discordjs/core";
import { rest } from "../client";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { createTicket, canUserCreateTicket } from "../lib/ticketCreation";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export async function handleModalSubmit(
  interaction: APIModalSubmitInteraction,
  api_: API
) {
  const customId = interaction.data.custom_id;
  const user = interaction.user ?? interaction.member?.user;
  if (!user || !interaction.guild_id) return;

  // Handle ticket creation modal
  if (customId.startsWith("modal:ticket:")) {
    await handleTicketModal(interaction, api_, customId, user);
    return;
  }
}

async function handleTicketModal(
  interaction: APIModalSubmitInteraction,
  api_: API,
  customId: string,
  user: APIUser
) {
  const optionId = customId.replace("modal:ticket:", "") as Id<"ticketOptions">;

  // Fetch the ticket option
  const option = await convex.query(api.ticketOptions.get, { id: optionId });
  if (!option) {
    await api_.interactions.reply(interaction.id, interaction.token, {
      content: "❌ This ticket option no longer exists.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Fetch server settings
  const settings = await convex.query(api.serverSettings.getByGuildId, {
    guildId: interaction.guild_id!,
  });

  if (!settings) {
    await api_.interactions.reply(interaction.id, interaction.token, {
      content: "❌ Server is not configured for tickets.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check if user can create a ticket (re-check in case state changed)
  const check = await canUserCreateTicket(interaction.guild_id!, user.id, settings);
  if (!check.allowed) {
    await api_.interactions.reply(interaction.id, interaction.token, {
      content: `❌ ${check.reason}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Extract modal responses
  const modalResponses: Array<{ fieldId: string; label: string; value: string }> = [];

  for (const row of interaction.data.components) {
    for (const component of row.components) {
      if ("custom_id" in component && "value" in component) {
        // Find the field label from the option
        const fieldConfig = option.modalFields?.find((f) => f.id === component.custom_id);
        modalResponses.push({
          fieldId: component.custom_id,
          label: fieldConfig?.label ?? component.custom_id,
          value: component.value,
        });
      }
    }
  }

  // Defer the response
  await api_.interactions.defer(interaction.id, interaction.token, {
    flags: MessageFlags.Ephemeral,
  });

  // Get guild info
  const guild = (await rest.get(Routes.guild(interaction.guild_id!))) as APIGuild;

  // Create the ticket
  const result = await createTicket({
    guildId: interaction.guild_id!,
    guildName: guild.name,
    user,
    option,
    serverSettings: settings,
    modalResponses,
  });

  if (result.success) {
    await api_.interactions.editReply(interaction.application_id, interaction.token, {
      content: `✅ Ticket created! <#${result.channelId}>`,
    });
  } else {
    await api_.interactions.editReply(interaction.application_id, interaction.token, {
      content: `❌ Failed to create ticket: ${result.error}`,
    });
  }
}
