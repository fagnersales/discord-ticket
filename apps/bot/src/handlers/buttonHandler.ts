import {
  ComponentType,
  MessageFlags,
  Routes,
  TextInputStyle,
  type API,
  type APIButtonComponentWithCustomId,
  type APIGuild,
  type APIMessageComponentButtonInteraction,
  type APIUser,
} from "@discordjs/core";
import { rest } from "../client";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { createTicket, canUserCreateTicket } from "../lib/ticketCreation";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export async function handleButtonInteraction(
  interaction: APIMessageComponentButtonInteraction,
  api_: API
) {
  const customId = (interaction.data as { custom_id: string }).custom_id;
  const user = interaction.user ?? interaction.member?.user;
  if (!user || !interaction.guild_id) return;

  // Handle ticket creation button
  if (customId.startsWith("ticket_create:")) {
    await handleTicketCreateButton(interaction, api_, customId, user);
    return;
  }

  // Handle ticket action buttons
  if (customId.startsWith("ticket:")) {
    await handleTicketButton(interaction, api_, customId, user);
    return;
  }
}

async function handleTicketCreateButton(
  interaction: APIMessageComponentButtonInteraction,
  api_: API,
  customId: string,
  user: APIUser
) {
  const optionId = customId.replace("ticket_create:", "") as Id<"ticketOptions">;

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
      custom_id: `modal:ticket:${optionId}`,
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

async function handleTicketButton(
  interaction: APIMessageComponentButtonInteraction,
  api_: API,
  customId: string,
  user: APIUser
) {
  const [, action, ticketId] = customId.split(":");

  if (action === "close") {
    // Fetch the ticket
    const ticket = await convex.query(api.tickets.get, {
      id: ticketId as Id<"tickets">,
    });

    if (!ticket) {
      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "❌ Ticket not found.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (ticket.status === "closed") {
      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "❌ This ticket is already closed.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if user has permission to close
    const userRoleIds = interaction.member?.roles ?? [];
    const canClose = await convex.query(api.serverSettings.canUserCloseTicket, {
      guildId: interaction.guild_id!,
      ticketId: ticketId as Id<"tickets">,
      userId: user.id,
      userRoleIds,
    });

    if (!canClose.allowed) {
      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `❌ ${canClose.reason ?? "You don't have permission to close this ticket."}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Close the ticket
    await convex.mutation(api.tickets.close, {
      id: ticketId as Id<"tickets">,
      closedById: user.id,
    });

    await api_.interactions.reply(interaction.id, interaction.token, {
      content: `🔒 Ticket closed by <@${user.id}>.`,
    });

    // TODO: Generate transcript and send to log channel
  }
}
