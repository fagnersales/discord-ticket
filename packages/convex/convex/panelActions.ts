import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Discord API types
interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

interface DiscordButton {
  type: 2;
  style: 1 | 2 | 3 | 4 | 5;
  label: string;
  emoji?: { name: string } | { id: string; name: string; animated?: boolean };
  custom_id?: string;
}

interface DiscordSelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: { name: string } | { id: string; name: string; animated?: boolean };
}

interface DiscordSelectMenu {
  type: 3;
  custom_id: string;
  placeholder?: string;
  options: DiscordSelectOption[];
}

type DiscordComponent = DiscordButton | DiscordSelectMenu;

interface DiscordActionRow {
  type: 1;
  components: DiscordComponent[];
}

interface DiscordMessage {
  embeds: DiscordEmbed[];
  components: DiscordActionRow[];
}

// Parse emoji string to Discord emoji object
function parseEmoji(emojiString?: string): { name: string } | { id: string; name: string; animated?: boolean } | undefined {
  if (!emojiString) return undefined;

  // Check for custom emoji format <:name:id> or <a:name:id>
  const customMatch = emojiString.match(/^<(a)?:(\w+):(\d+)>$/);
  if (customMatch) {
    return {
      id: customMatch[3],
      name: customMatch[2],
      animated: customMatch[1] === "a",
    };
  }

  // Unicode emoji
  return { name: emojiString };
}

export const postPanel = action({
  args: {
    panelId: v.id("ticketPanels"),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the panel
    const panel = await ctx.runQuery(api.ticketPanels.get, { id: args.panelId });
    if (!panel) {
      throw new Error("Panel not found");
    }

    // Get enabled options for this panel
    const allOptions = await ctx.runQuery(api.ticketOptions.listByGuild, { guildId: panel.guildId });
    const options = allOptions
      .filter((o) => panel.optionIds.includes(o._id as Id<"ticketOptions">) && o.enabled)
      .sort((a, b) => a.order - b.order);

    if (options.length === 0) {
      throw new Error("No enabled options for this panel");
    }

    // Build the message
    const embed: DiscordEmbed = {};
    if (panel.embed.title) embed.title = panel.embed.title;
    if (panel.embed.description) embed.description = panel.embed.description;
    if (panel.embed.color) embed.color = panel.embed.color;
    if (panel.embed.footer) embed.footer = panel.embed.footer;
    if (panel.embed.thumbnail) embed.thumbnail = panel.embed.thumbnail;
    if (panel.embed.image) embed.image = panel.embed.image;
    if (panel.embed.fields) embed.fields = panel.embed.fields;

    const components: DiscordActionRow[] = [];

    if (panel.style === "buttons") {
      // Create button rows (max 5 buttons per row)
      for (let i = 0; i < options.length; i += 5) {
        const rowOptions = options.slice(i, i + 5);
        const row: DiscordActionRow = {
          type: 1,
          components: rowOptions.map((option) => {
            const button: DiscordButton = {
              type: 2,
              style: 1, // Primary (blurple)
              label: option.name,
              custom_id: `ticket_create:${option._id}`,
            };
            const emoji = parseEmoji(option.emoji);
            if (emoji) button.emoji = emoji;
            return button;
          }),
        };
        components.push(row);
      }
    } else {
      // Create dropdown
      const selectMenu: DiscordSelectMenu = {
        type: 3,
        custom_id: "ticket_create_select",
        placeholder: panel.dropdownPlaceholder || "Select a ticket type...",
        options: options.map((option) => {
          const selectOption: DiscordSelectOption = {
            label: option.name,
            value: option._id,
          };
          if (option.description) selectOption.description = option.description.slice(0, 100);
          const emoji = parseEmoji(option.emoji);
          if (emoji) selectOption.emoji = emoji;
          return selectOption;
        }),
      };
      components.push({ type: 1, components: [selectMenu] });
    }

    const message: DiscordMessage = {
      embeds: [embed],
      components,
    };

    // Get bot token from environment
    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) {
      throw new Error("DISCORD_TOKEN not configured in Convex environment");
    }

    // Send the message to Discord
    const response = await fetch(
      `https://discord.com/api/v10/channels/${args.channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Discord API error:", error);
      throw new Error(`Failed to post message: ${response.status}`);
    }

    const discordMessage = await response.json();

    // Save the panel message reference
    await ctx.runMutation(api.ticketPanels.addMessage, {
      panelId: args.panelId,
      guildId: panel.guildId,
      channelId: args.channelId,
      messageId: discordMessage.id,
    });

    return { messageId: discordMessage.id };
  },
});

export const refreshPanel = action({
  args: {
    panelId: v.id("ticketPanels"),
  },
  handler: async (ctx, args) => {
    // Get the panel
    const panel = await ctx.runQuery(api.ticketPanels.get, { id: args.panelId });
    if (!panel) {
      throw new Error("Panel not found");
    }

    // Get all posted messages for this panel
    const panelMessages = await ctx.runQuery(api.ticketPanels.listMessagesByPanel, { panelId: args.panelId });
    if (panelMessages.length === 0) {
      return { updated: 0 };
    }

    // Get enabled options for this panel
    const allOptions = await ctx.runQuery(api.ticketOptions.listByGuild, { guildId: panel.guildId });
    const options = allOptions
      .filter((o) => panel.optionIds.includes(o._id as Id<"ticketOptions">) && o.enabled)
      .sort((a, b) => a.order - b.order);

    // Build the updated message
    const embed: DiscordEmbed = {};
    if (panel.embed.title) embed.title = panel.embed.title;
    if (panel.embed.description) embed.description = panel.embed.description;
    if (panel.embed.color) embed.color = panel.embed.color;
    if (panel.embed.footer) embed.footer = panel.embed.footer;
    if (panel.embed.thumbnail) embed.thumbnail = panel.embed.thumbnail;
    if (panel.embed.image) embed.image = panel.embed.image;
    if (panel.embed.fields) embed.fields = panel.embed.fields;

    const components: DiscordActionRow[] = [];

    if (panel.style === "buttons") {
      for (let i = 0; i < options.length; i += 5) {
        const rowOptions = options.slice(i, i + 5);
        const row: DiscordActionRow = {
          type: 1,
          components: rowOptions.map((option) => {
            const button: DiscordButton = {
              type: 2,
              style: 1,
              label: option.name,
              custom_id: `ticket_create:${option._id}`,
            };
            const emoji = parseEmoji(option.emoji);
            if (emoji) button.emoji = emoji;
            return button;
          }),
        };
        components.push(row);
      }
    } else {
      const selectMenu: DiscordSelectMenu = {
        type: 3,
        custom_id: "ticket_create_select",
        placeholder: panel.dropdownPlaceholder || "Select a ticket type...",
        options: options.map((option) => {
          const selectOption: DiscordSelectOption = {
            label: option.name,
            value: option._id,
          };
          if (option.description) selectOption.description = option.description.slice(0, 100);
          const emoji = parseEmoji(option.emoji);
          if (emoji) selectOption.emoji = emoji;
          return selectOption;
        }),
      };
      components.push({ type: 1, components: [selectMenu] });
    }

    const message: DiscordMessage = {
      embeds: [embed],
      components,
    };

    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) {
      throw new Error("DISCORD_TOKEN not configured in Convex environment");
    }

    // Update each message
    let updated = 0;
    const failedMessageIds: string[] = [];

    for (const pm of panelMessages) {
      try {
        const response = await fetch(
          `https://discord.com/api/v10/channels/${pm.channelId}/messages/${pm.messageId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          }
        );

        if (response.ok) {
          updated++;
        } else if (response.status === 404) {
          // Message was deleted, remove the reference
          failedMessageIds.push(pm.messageId);
        } else {
          console.error(`Failed to update message ${pm.messageId}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error updating message ${pm.messageId}:`, error);
      }
    }

    // Remove references to deleted messages
    for (const messageId of failedMessageIds) {
      await ctx.runMutation(api.ticketPanels.removeMessage, { messageId });
    }

    return { updated, removed: failedMessageIds.length };
  },
});

export const deletePanelMessage = action({
  args: {
    id: v.id("panelMessages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const panelMessage = await ctx.runQuery(api.ticketPanels.getPanelMessageById, { id: args.id });

    if (!panelMessage) {
      throw new Error("Panel message not found");
    }

    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) {
      throw new Error("DISCORD_TOKEN not configured in Convex environment");
    }

    // Delete the message from Discord
    const response = await fetch(
      `https://discord.com/api/v10/channels/${panelMessage.channelId}/messages/${panelMessage.messageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    // 204 = success, 404 = already deleted (both are fine)
    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      console.error("Discord API error:", error);
      throw new Error(`Failed to delete message: ${response.status}`);
    }

    // Remove from database
    await ctx.runMutation(api.ticketPanels.removeMessageById, { id: args.id });

    return null;
  },
});
