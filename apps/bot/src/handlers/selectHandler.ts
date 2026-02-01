import {
  ComponentType,
  MessageFlags,
  Routes,
  TextInputStyle,
  type API,
  type APIGuild,
  type APIMessageComponentSelectMenuInteraction,
  type APIUser,
} from "@discordjs/core";
import { rest } from "../client";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { createTicket, canUserCreateTicket } from "../lib/ticketCreation";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export async function handleSelectMenuInteraction(
  interaction: APIMessageComponentSelectMenuInteraction,
  api_: API
) {
  const customId = interaction.data.custom_id;
  const user = interaction.user ?? interaction.member?.user;
  if (!user || !interaction.guild_id) return;

  // Handle panel dropdown
  if (customId.startsWith("panel:select:")) {
    await handlePanelSelect(interaction, api_, user);
    return;
  }
}

async function handlePanelSelect(
  interaction: APIMessageComponentSelectMenuInteraction,
  api_: API,
  user: APIUser
) {
  // The selected option ID is in the values array
  const selectedOptionId = interaction.data.values[0] as Id<"ticketOptions">;

  if (!selectedOptionId) {
    await api_.interactions.reply(interaction.id, interaction.token, {
      content: "❌ No option selected.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Fetch the ticket option
  const option = await convex.query(api.ticketOptions.get, { id: selectedOptionId });
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

  // Check if user can create a ticket
  const check = await canUserCreateTicket(interaction.guild_id!, user.id, settings);
  if (!check.allowed) {
    await api_.interactions.reply(interaction.id, interaction.token, {
      content: `❌ ${check.reason}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // If option requires modal, show it
  if (option.useModal && option.modalFields && option.modalFields.length > 0) {
    await api_.interactions.createModal(interaction.id, interaction.token, {
      custom_id: `modal:ticket:${selectedOptionId}`,
      title: option.modalTitle ?? `Create ${option.name} Ticket`,
      components: option.modalFields.slice(0, 5).map((field) => ({
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            custom_id: field.id,
            label: field.label,
            style: field.style === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short,
            placeholder: field.placeholder,
            required: field.required,
            min_length: field.minLength,
            max_length: field.maxLength,
          },
        ],
      })),
    });
    return;
  }

  // Create ticket directly
  await api_.interactions.defer(interaction.id, interaction.token, {
    flags: MessageFlags.Ephemeral,
  });

  const guild = (await rest.get(Routes.guild(interaction.guild_id!))) as APIGuild;

  const result = await createTicket({
    guildId: interaction.guild_id!,
    guildName: guild.name,
    user,
    option,
    serverSettings: settings,
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
