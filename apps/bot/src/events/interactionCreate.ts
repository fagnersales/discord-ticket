import {
  InteractionType,
  MessageFlags,
  ComponentType,
  Routes,
  ButtonStyle,
  type APIInteraction,
  type API,
  type APIChatInputApplicationCommandInteraction,
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteractionDataOption,
  type APIApplicationCommandInteractionDataSubcommandOption,
  type APIEmbed,
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIStringSelectComponent,
  type APIMessageComponentButtonInteraction,
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
      await handleButtonInteraction(interaction as APIMessageComponentButtonInteraction, api_);
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

  // Handle autocomplete
  if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
    await handleAutocomplete(interaction, api_);
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

async function handlePanelCommand(
  interaction: APIChatInputApplicationCommandInteraction,
  api_: API
) {
  const subcommand = getSubcommand(interaction.data.options);
  if (!subcommand || !interaction.guild_id) return;

  switch (subcommand.name) {
    case "post": {
      const panelName = subcommand.options.get("panel_name") as string;

      // Find panel by name (could be ID or name)
      const panels = await convex.query(api.ticketPanels.listByGuild, {
        guildId: interaction.guild_id,
      });

      // Try to find by ID first (for autocomplete), then by name
      let panel = panels.find((p) => p._id === panelName);
      if (!panel) {
        panel = panels.find((p) => p.name.toLowerCase() === panelName.toLowerCase());
      }

      if (!panel) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Panel not found. Create panels in the dashboard first.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Get options for this panel
      const allOptions = await convex.query(api.ticketOptions.listByGuild, {
        guildId: interaction.guild_id,
      });
      const options = allOptions
        .filter((o) => panel!.optionIds.includes(o._id as Id<"ticketOptions">) && o.enabled)
        .sort((a, b) => a.order - b.order);

      if (options.length === 0) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ This panel has no enabled ticket options.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Build embed
      const embed: APIEmbed = {};
      if (panel.embed.title) embed.title = panel.embed.title;
      if (panel.embed.description) embed.description = panel.embed.description;
      if (panel.embed.color) embed.color = panel.embed.color;

      // Build components based on style
      let components: APIActionRowComponent<APIButtonComponent | APIStringSelectComponent>[];

      if (panel.style === "buttons") {
        const rows: APIActionRowComponent<APIButtonComponent>[] = [];
        let currentRow: APIButtonComponent[] = [];

        for (const option of options.slice(0, 25)) {
          const button: APIButtonComponent = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: option.name,
            custom_id: `ticket_create:${option._id}`,
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
          custom_id: `ticket_create_select`,
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

      // Send the panel message
      const message = await rest.post(Routes.channelMessages(interaction.channel.id), {
        body: {
          embeds: [embed],
          components,
        },
      }) as { id: string };

      // Save the panel message reference
      await convex.mutation(api.ticketPanels.addMessage, {
        panelId: panel._id,
        guildId: interaction.guild_id,
        channelId: interaction.channel.id,
        messageId: message.id,
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: `✅ Panel "${panel.name}" posted!`,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "delete": {
      const messageId = subcommand.options.get("message_id") as string;

      // Find the panel message reference
      const panelMessage = await convex.query(api.ticketPanels.getPanelMessage, { messageId });

      if (!panelMessage) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Panel message not found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Delete the Discord message
      try {
        await rest.delete(Routes.channelMessage(panelMessage.channelId, messageId));
      } catch {
        // Message might already be deleted
      }

      // Remove the panel message reference (keeps the panel config for reuse)
      await convex.mutation(api.ticketPanels.removeMessage, { messageId });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "✅ Panel message removed.",
        flags: MessageFlags.Ephemeral,
      });
      break;
    }

    case "refresh": {
      const messageId = subcommand.options.get("message_id") as string;

      // Find the panel message reference
      const panelMessage = await convex.query(api.ticketPanels.getPanelMessage, { messageId });

      if (!panelMessage) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Panel message not found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Get the panel configuration
      const panel = await convex.query(api.ticketPanels.get, { id: panelMessage.panelId });

      if (!panel) {
        await api_.interactions.reply(interaction.id, interaction.token, {
          content: "❌ Panel configuration not found.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Get options that are both on this panel AND enabled
      const allOptions = await convex.query(api.ticketOptions.listByGuild, {
        guildId: interaction.guild_id,
      });
      const options = allOptions
        .filter((o) => panel.optionIds.includes(o._id as Id<"ticketOptions">) && o.enabled)
        .sort((a, b) => a.order - b.order);

      // Rebuild embed
      const embed: APIEmbed = {};
      if (panel.embed.title) embed.title = panel.embed.title;
      if (panel.embed.description) embed.description = panel.embed.description;
      if (panel.embed.color) embed.color = panel.embed.color;

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
            custom_id: `ticket_create:${option._id}`,
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
          custom_id: `ticket_create_select`,
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
      await rest.patch(Routes.channelMessage(panelMessage.channelId, messageId), {
        body: { embeds: [embed], components },
      });

      await api_.interactions.reply(interaction.id, interaction.token, {
        content: "✅ Panel refreshed.",
        flags: MessageFlags.Ephemeral,
      });
      break;
    }
  }
}

async function handleAutocomplete(
  interaction: APIApplicationCommandAutocompleteInteraction,
  api_: API
) {
  if (!interaction.guild_id) return;

  const commandName = interaction.data.name;
  const options = interaction.data.options;

  // Handle /panel post autocomplete
  if (commandName === "panel" && options) {
    const subcommand = options.find((o) => o.name === "post" && o.type === 1);
    if (subcommand && "options" in subcommand && subcommand.options) {
      const focusedOption = subcommand.options.find((o) => "focused" in o && o.focused);
      if (focusedOption && focusedOption.name === "panel_name") {
        const query = ("value" in focusedOption ? String(focusedOption.value) : "").toLowerCase();

        // Get all panels for this guild
        const panels = await convex.query(api.ticketPanels.listByGuild, {
          guildId: interaction.guild_id,
        });

        // Filter by query and return up to 25 results
        const choices = panels
          .filter((p) => p.name.toLowerCase().includes(query))
          .slice(0, 25)
          .map((p) => ({
            name: p.name,
            value: p._id,
          }));

        await api_.interactions.createAutocompleteResponse(
          interaction.id,
          interaction.token,
          { choices }
        );
        return;
      }
    }
  }

  // Default empty response
  await api_.interactions.createAutocompleteResponse(
    interaction.id,
    interaction.token,
    { choices: [] }
  );
}
