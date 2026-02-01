import {
  InteractionType,
  MessageFlags,
  ComponentType,
  Routes,
  ButtonStyle,
  type APIInteraction,
  type API,
  type APIChatInputApplicationCommandInteraction,
  type APIApplicationCommandInteractionDataOption,
  type APIApplicationCommandInteractionDataSubcommandOption,
  type APIEmbed,
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIStringSelectComponent,
} from "@discordjs/core";
import { rest } from "../client";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { handleButtonInteraction } from "../handlers/buttonHandler";
import { handleSelectMenuInteraction } from "../handlers/selectHandler";
import { handleModalSubmit } from "../handlers/modalHandler";
import { addUserToChannel, removeUserFromChannel, renameChannel } from "../lib/channelManager";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export async function handleInteractionCreate(interaction: APIInteraction, api_: API) {
  // Handle component interactions (buttons, selects)
  if (interaction.type === InteractionType.MessageComponent) {
    if (interaction.data.component_type === ComponentType.Button) {
      await handleButtonInteraction(interaction, api_);
    } else if (
      interaction.data.component_type === ComponentType.StringSelect ||
      interaction.data.component_type === ComponentType.UserSelect ||
      interaction.data.component_type === ComponentType.RoleSelect ||
      interaction.data.component_type === ComponentType.MentionableSelect ||
      interaction.data.component_type === ComponentType.ChannelSelect
    ) {
      await handleSelectMenuInteraction(interaction as any, api_);
    }
    return;
  }

  // Handle modal submissions
  if (interaction.type === InteractionType.ModalSubmit) {
    await handleModalSubmit(interaction, api_);
    return;
  }

  // Handle application commands
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (!("name" in interaction.data)) return;

  const commandInteraction = interaction as APIChatInputApplicationCommandInteraction;

  switch (commandInteraction.data.name) {
    case "ping":
      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "Pong!",
        flags: MessageFlags.Ephemeral,
      });
      break;

    case "ticket":
      await handleTicketCommand(commandInteraction, api_);
      break;

    case "settings":
      await handleSettingsCommand(commandInteraction, api_);
      break;

    case "panel":
      await handlePanelCommand(commandInteraction, api_);
      break;
  }
}

function getSubcommand(options?: APIApplicationCommandInteractionDataOption[]): {
  name: string;
  options: Map<string, any>;
} | null {
  if (!options) return null;

  for (const opt of options) {
    if (opt.type === 1) {
      // Subcommand
      const subOpts = new Map<string, any>();
      if ("options" in opt && opt.options) {
        for (const subOpt of opt.options) {
          if ("value" in subOpt) {
            subOpts.set(subOpt.name, subOpt.value);
          }
        }
      }
      return { name: opt.name, options: subOpts };
    }
  }
  return null;
}

async function handleTicketCommand(
  interaction: APIChatInputApplicationCommandInteraction,
  api_: API
) {
  const subcommand = getSubcommand(interaction.data.options);
  if (!subcommand || !interaction.guild_id) return;

  const user = interaction.user ?? interaction.member?.user;
  if (!user) return;

  // Get the ticket for this channel
  const ticket = await convex.query(api.tickets.getByChannelId, {
    channelId: interaction.channel.id,
  });

  if (!ticket) {
    await api_.interactions.reply(interaction.id, interaction.token, {
      content: "❌ This command can only be used in a ticket channel.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  switch (subcommand.name) {
    case "close": {
      if (ticket.status === "closed") {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ This ticket is already closed.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const reason = subcommand.options.get("reason") as string | undefined;

      await convex.mutation(api.tickets.close, {
        id: ticket._id,
        closedById: user.id,
        reason,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `🔒 Ticket closed by <@${user.id}>.${reason ? `\n**Reason:** ${reason}` : ""}`,
      });
      break;
    }

    case "add": {
      const targetUserId = subcommand.options.get("user") as string;

      await addUserToChannel(interaction.channel.id, targetUserId);
      await convex.mutation(api.tickets.addUser, {
        id: ticket._id,
        userId: targetUserId,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ Added <@${targetUserId}> to the ticket.`,
      });
      break;
    }

    case "remove": {
      const targetUserId = subcommand.options.get("user") as string;

      // Don't allow removing the ticket creator
      if (targetUserId === ticket.creatorId) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Cannot remove the ticket creator.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await removeUserFromChannel(interaction.channel.id, targetUserId);
      await convex.mutation(api.tickets.removeUser, {
        id: ticket._id,
        userId: targetUserId,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ Removed <@${targetUserId}> from the ticket.`,
      });
      break;
    }

    case "priority": {
      const priority = subcommand.options.get("level") as "low" | "normal" | "high" | "urgent";

      await convex.mutation(api.tickets.setPriority, {
        id: ticket._id,
        priority,
      });

      const priorityEmoji = {
        low: "🟢",
        normal: "🟡",
        high: "🟠",
        urgent: "🔴",
      };

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `${priorityEmoji[priority]} Priority set to **${priority}**.`,
      });
      break;
    }

    case "rename": {
      const name = subcommand.options.get("name") as string;

      await renameChannel(interaction.channel.id, name);

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ Channel renamed to **${name}**.`,
      });
      break;
    }
  }
}

async function handleSettingsCommand(
  interaction: APIChatInputApplicationCommandInteraction,
  api_: API
) {
  const subcommand = getSubcommand(interaction.data.options);
  if (!subcommand || !interaction.guild_id) return;

  const user = interaction.user ?? interaction.member?.user;
  if (!user) return;

  switch (subcommand.name) {
    case "setup": {
      const categoryId = subcommand.options.get("category") as string | undefined;
      const logChannelId = subcommand.options.get("log_channel") as string | undefined;
      const maxTickets = subcommand.options.get("max_tickets") as number | undefined;

      await convex.mutation(api.serverSettings.upsert, {
        guildId: interaction.guild_id,
        ownerId: user.id,
        ticketCategoryId: categoryId,
        logChannelId: logChannelId,
        maxOpenTicketsPerUser: maxTickets,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "✅ Server settings updated!",
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "staff": {
      const action = subcommand.options.get("action") as "add" | "remove";
      const roleId = subcommand.options.get("role") as string;

      const settings = await convex.query(api.serverSettings.getByGuildId, {
        guildId: interaction.guild_id,
      });

      if (!settings) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Please run `/settings setup` first.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      let newStaffRoles = [...settings.staffRoleIds];
      if (action === "add" && !newStaffRoles.includes(roleId)) {
        newStaffRoles.push(roleId);
      } else if (action === "remove") {
        newStaffRoles = newStaffRoles.filter((id) => id !== roleId);
      }

      await convex.mutation(api.serverSettings.upsert, {
        guildId: interaction.guild_id,
        ownerId: settings.ownerId,
        staffRoleIds: newStaffRoles,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ ${action === "add" ? "Added" : "Removed"} <@&${roleId}> ${action === "add" ? "to" : "from"} staff roles.`,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "admin": {
      const action = subcommand.options.get("action") as "add" | "remove";
      const roleId = subcommand.options.get("role") as string;

      const settings = await convex.query(api.serverSettings.getByGuildId, {
        guildId: interaction.guild_id,
      });

      if (!settings) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Please run `/settings setup` first.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      let newAdminRoles = [...settings.adminRoleIds];
      if (action === "add" && !newAdminRoles.includes(roleId)) {
        newAdminRoles.push(roleId);
      } else if (action === "remove") {
        newAdminRoles = newAdminRoles.filter((id) => id !== roleId);
      }

      await convex.mutation(api.serverSettings.upsert, {
        guildId: interaction.guild_id,
        ownerId: settings.ownerId,
        adminRoleIds: newAdminRoles,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ ${action === "add" ? "Added" : "Removed"} <@&${roleId}> ${action === "add" ? "to" : "from"} admin roles.`,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "blacklist": {
      const action = subcommand.options.get("action") as "add" | "remove";
      const userId = subcommand.options.get("user") as string;

      if (action === "add") {
        await convex.mutation(api.serverSettings.addToBlacklist, {
          guildId: interaction.guild_id,
          userId,
        });
      } else {
        await convex.mutation(api.serverSettings.removeFromBlacklist, {
          guildId: interaction.guild_id,
          userId,
        });
      }

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ ${action === "add" ? "Added" : "Removed"} <@${userId}> ${action === "add" ? "to" : "from"} the blacklist.`,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "option": {
      const name = subcommand.options.get("name") as string;
      const description = subcommand.options.get("description") as string | undefined;
      const emoji = subcommand.options.get("emoji") as string | undefined;
      const roleId = subcommand.options.get("role") as string | undefined;

      // Ensure server settings exist
      const settings = await convex.query(api.serverSettings.getByGuildId, {
        guildId: interaction.guild_id,
      });

      if (!settings) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Please run `/settings setup` first.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await convex.mutation(api.ticketOptions.create, {
        guildId: interaction.guild_id,
        name,
        description,
        emoji,
        channelNameTemplate: `ticket-{ticketNumber}`,
        responsibleRoleIds: roleId ? [roleId] : settings.staffRoleIds,
        useModal: false,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ Created ticket option **${name}**.`,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "view": {
      const settings = await convex.query(api.serverSettings.getByGuildId, {
        guildId: interaction.guild_id,
      });

      if (!settings) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ No settings found. Run `/settings setup` to configure the bot.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const options = await convex.query(api.ticketOptions.listByGuild, {
        guildId: interaction.guild_id,
      });

      const embed: APIEmbed = {
        title: "Ticket Bot Settings",
        color: 0x5865f2,
        fields: [
          {
            name: "Ticket Category",
            value: settings.ticketCategoryId ? `<#${settings.ticketCategoryId}>` : "*Not set*",
            inline: true,
          },
          {
            name: "Log Channel",
            value: settings.logChannelId ? `<#${settings.logChannelId}>` : "*Not set*",
            inline: true,
          },
          {
            name: "Max Tickets/User",
            value: settings.maxOpenTicketsPerUser.toString(),
            inline: true,
          },
          {
            name: "Staff Roles",
            value: settings.staffRoleIds.length > 0
              ? settings.staffRoleIds.map((id) => `<@&${id}>`).join(", ")
              : "*None*",
            inline: false,
          },
          {
            name: "Admin Roles",
            value: settings.adminRoleIds.length > 0
              ? settings.adminRoleIds.map((id) => `<@&${id}>`).join(", ")
              : "*None*",
            inline: false,
          },
          {
            name: "Ticket Options",
            value: options.length > 0
              ? options.map((o) => `${o.emoji ?? "📋"} ${o.name}${o.enabled ? "" : " *(disabled)*"}`).join("\n")
              : "*None created*",
            inline: false,
          },
        ],
      };

      await api_.interactions.reply(interaction.id, interaction.token, {
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      break;
    }
  }
}

async function handlePanelCommand(
  interaction: APIChatInputApplicationCommandInteraction,
  api_: API
) {
  const subcommand = getSubcommand(interaction.data.options);
  if (!subcommand || !interaction.guild_id) return;

  switch (subcommand.name) {
    case "create": {
      const style = subcommand.options.get("style") as "buttons" | "dropdown";
      const title = subcommand.options.get("title") as string | undefined;
      const description = subcommand.options.get("description") as string | undefined;
      const colorHex = subcommand.options.get("color") as string | undefined;

      // Get ticket options
      const options = await convex.query(api.ticketOptions.listEnabledByGuild, {
        guildId: interaction.guild_id,
      });

      if (options.length === 0) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ No ticket options configured. Use `/settings option` to create one first.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Build embed
      const embed: APIEmbed = {
        title: title ?? "🎫 Support Tickets",
        description: description ?? "Click a button below to create a ticket.",
        color: colorHex ? parseInt(colorHex, 16) : 0x5865f2,
      };

      // Build components based on style
      let components: APIActionRowComponent<APIButtonComponent | APIStringSelectComponent>[];

      if (style === "buttons") {
        // Create button rows (max 5 buttons per row, max 5 rows)
        const rows: APIActionRowComponent<APIButtonComponent>[] = [];
        let currentRow: APIButtonComponent[] = [];

        for (const option of options.slice(0, 25)) {
          const button: APIButtonComponent = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: option.name,
            custom_id: `panel:option:${option._id}`,
            emoji: option.emoji ? { name: option.emoji } : undefined,
          };
          currentRow.push(button);

          if (currentRow.length === 5) {
            rows.push({ type: ComponentType.ActionRow, components: currentRow });
            currentRow = [];
          }
        }

        if (currentRow.length > 0) {
          rows.push({ type: ComponentType.ActionRow, components: currentRow });
        }

        components = rows;
      } else {
        // Create dropdown
        const selectMenu: APIStringSelectComponent = {
          type: ComponentType.StringSelect,
          custom_id: `panel:select:${interaction.guild_id}`,
          placeholder: "Select a ticket type...",
          options: options.slice(0, 25).map((option) => ({
            label: option.name,
            value: option._id,
            description: option.description?.slice(0, 100),
            emoji: option.emoji ? { name: option.emoji } : undefined,
          })),
        };

        components = [{ type: ComponentType.ActionRow, components: [selectMenu] }];
      }

      // Send the panel message
      const message = await rest.post(Routes.channelMessages(interaction.channel.id), {
        body: {
          embeds: [embed],
          components,
        },
      }) as { id: string };

      // Save panel to database
      const panelId = await convex.mutation(api.ticketPanels.create, {
        guildId: interaction.guild_id,
        channelId: interaction.channel.id,
        embed: {
          title: embed.title,
          description: embed.description,
          color: embed.color,
        },
        style,
        optionIds: options.map((o) => o._id),
      });

      // Set the message ID
      await convex.mutation(api.ticketPanels.setMessageId, {
        id: panelId,
        messageId: message.id,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "✅ Panel created!",
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "delete": {
      const messageId = subcommand.options.get("message_id") as string;

      // Find and delete the panel
      const panel = await convex.query(api.ticketPanels.getByMessageId, { messageId });

      if (!panel) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Panel not found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Delete the Discord message
      try {
        await rest.delete(Routes.channelMessage(panel.channelId, messageId));
      } catch {
        // Message might already be deleted
      }

      // Delete from database
      await convex.mutation(api.ticketPanels.remove, { id: panel._id });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "✅ Panel deleted.",
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "refresh": {
      const messageId = subcommand.options.get("message_id") as string;

      const panel = await convex.query(api.ticketPanels.getByMessageId, { messageId });

      if (!panel) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Panel not found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Get current ticket options
      const options = await convex.query(api.ticketOptions.listEnabledByGuild, {
        guildId: interaction.guild_id,
      });

      // Rebuild components
      let components: APIActionRowComponent<APIButtonComponent | APIStringSelectComponent>[];

      if (panel.style === "buttons") {
        const rows: APIActionRowComponent<APIButtonComponent>[] = [];
        let currentRow: APIButtonComponent[] = [];

        for (const option of options.slice(0, 25)) {
          const button: APIButtonComponent = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: option.name,
            custom_id: `panel:option:${option._id}`,
            emoji: option.emoji ? { name: option.emoji } : undefined,
          };
          currentRow.push(button);

          if (currentRow.length === 5) {
            rows.push({ type: ComponentType.ActionRow, components: currentRow });
            currentRow = [];
          }
        }

        if (currentRow.length > 0) {
          rows.push({ type: ComponentType.ActionRow, components: currentRow });
        }

        components = rows;
      } else {
        const selectMenu: APIStringSelectComponent = {
          type: ComponentType.StringSelect,
          custom_id: `panel:select:${interaction.guild_id}`,
          placeholder: panel.dropdownPlaceholder ?? "Select a ticket type...",
          options: options.slice(0, 25).map((option) => ({
            label: option.name,
            value: option._id,
            description: option.description?.slice(0, 100),
            emoji: option.emoji ? { name: option.emoji } : undefined,
          })),
        };

        components = [{ type: ComponentType.ActionRow, components: [selectMenu] }];
      }

      // Update the message
      await rest.patch(Routes.channelMessage(panel.channelId, messageId), {
        body: { components },
      });

      // Update panel option IDs
      await convex.mutation(api.ticketPanels.update, {
        id: panel._id,
        optionIds: options.map((o) => o._id),
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "✅ Panel refreshed.",
        flags: MessageFlags.Ephemeral,
      });
      break;
    }
  }
}
