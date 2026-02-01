import {
  Routes,
  type APIEmbed,
  type APIMessage,
  type APIUser,
  type APIActionRowComponent,
  type APIButtonComponent,
  ButtonStyle,
  ComponentType,
} from "@discordjs/core";
import { rest } from "../client";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { createTicketChannel } from "./channelManager";
import { replacePlaceholders, replaceChannelNamePlaceholders, type PlaceholderContext } from "./placeholders";
import type { Doc, Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export interface TicketCreationContext {
  guildId: string;
  guildName: string;
  user: APIUser;
  option: Doc<"ticketOptions">;
  serverSettings: Doc<"serverSettings">;
  modalResponses?: Array<{ fieldId: string; label: string; value: string }>;
}

export interface TicketCreationResult {
  success: boolean;
  ticketId?: Id<"tickets">;
  channelId?: string;
  error?: string;
}

export async function createTicket(
  context: TicketCreationContext
): Promise<TicketCreationResult> {
  const { guildId, guildName, user, option, serverSettings, modalResponses } = context;

  try {
    // Get next ticket number
    const ticketNumber = await convex.mutation(api.serverSettings.incrementTicketCounter, {
      guildId,
    });

    // Build placeholder context
    const placeholderContext: PlaceholderContext = {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.global_name ?? user.username,
        mention: `<@${user.id}>`,
      },
      ticket: {
        number: ticketNumber,
        channelId: "", // Will be set after channel creation
        channelMention: "", // Will be set after channel creation
      },
      option: {
        name: option.name,
      },
      modal: modalResponses?.reduce(
        (acc, r) => ({ ...acc, [r.fieldId]: r.value }),
        {} as Record<string, string>
      ),
      server: {
        name: guildName,
      },
    };

    // Generate channel name
    const channelName = replaceChannelNamePlaceholders(
      option.channelNameTemplate,
      placeholderContext
    );

    // Determine category ID (with fallback)
    let categoryId = option.categoryId ?? serverSettings.ticketCategoryId;

    // Try to create the channel, with fallback to secondary category if primary is full
    let channel;
    try {
      channel = await createTicketChannel({
        guildId,
        name: channelName,
        categoryId,
        creatorId: user.id,
        responsibleRoleIds: option.responsibleRoleIds,
        topic: `Ticket #${ticketNumber} - ${option.name} - Created by ${user.username}`,
      });
    } catch (error: any) {
      // If category is full (error code 50035 with MAX_CHANNELS_IN_CATEGORY), try fallback
      const isCategoryFull = error?.code === 50035 ||
        (error?.message?.includes("Maximum number of channels") ||
         error?.message?.includes("category"));

      if (isCategoryFull && serverSettings.fallbackCategoryId &&
          serverSettings.fallbackCategoryId !== categoryId) {
        console.log("Primary category full, trying fallback category");
        channel = await createTicketChannel({
          guildId,
          name: channelName,
          categoryId: serverSettings.fallbackCategoryId,
          creatorId: user.id,
          responsibleRoleIds: option.responsibleRoleIds,
          topic: `Ticket #${ticketNumber} - ${option.name} - Created by ${user.username}`,
        });
      } else if (isCategoryFull) {
        // Try creating without a category
        console.log("Category full and no fallback, creating channel without category");
        channel = await createTicketChannel({
          guildId,
          name: channelName,
          categoryId: undefined,
          creatorId: user.id,
          responsibleRoleIds: option.responsibleRoleIds,
          topic: `Ticket #${ticketNumber} - ${option.name} - Created by ${user.username}`,
        });
      } else {
        throw error;
      }
    }

    // Update placeholder context with channel info
    placeholderContext.ticket.channelId = channel.id;
    placeholderContext.ticket.channelMention = `<#${channel.id}>`;

    // Create ticket in Convex
    const ticketId = await convex.mutation(api.tickets.create, {
      guildId,
      channelId: channel.id,
      ticketNumber,
      optionId: option._id,
      creatorId: user.id,
      creatorUsername: user.username,
      modalResponses,
    });

    // Send initial message
    const initialMessage = await sendInitialMessage(
      channel.id,
      option,
      placeholderContext,
      ticketId,
      modalResponses
    );

    // Record the initial message
    if (initialMessage) {
      const botUser = await rest.get(Routes.user("@me")) as APIUser;
      await convex.mutation(api.ticketMessages.recordSend, {
        ticketId,
        messageId: initialMessage.id,
        authorId: botUser.id,
        authorUsername: botUser.username,
        content: initialMessage.content || "",
        isSystemMessage: true,
      });
    }

    return {
      success: true,
      ticketId,
      channelId: channel.id,
    };
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function sendInitialMessage(
  channelId: string,
  option: Doc<"ticketOptions">,
  context: PlaceholderContext,
  ticketId: Id<"tickets">,
  modalResponses?: Array<{ fieldId: string; label: string; value: string }>
): Promise<APIMessage | null> {
  const initialMsg = option.initialMessage;

  // Build the message content
  let content = initialMsg?.content
    ? replacePlaceholders(initialMsg.content, context)
    : undefined;

  // Build embed
  let embed: APIEmbed | undefined;
  if (initialMsg?.embed) {
    embed = {
      title: initialMsg.embed.title
        ? replacePlaceholders(initialMsg.embed.title, context)
        : undefined,
      description: initialMsg.embed.description
        ? replacePlaceholders(initialMsg.embed.description, context)
        : undefined,
      color: initialMsg.embed.color,
      footer: initialMsg.embed.footer
        ? {
            text: replacePlaceholders(initialMsg.embed.footer.text, context),
            icon_url: initialMsg.embed.footer.icon_url,
          }
        : undefined,
      thumbnail: initialMsg.embed.thumbnail,
      image: initialMsg.embed.image,
      fields: initialMsg.embed.fields?.map((f) => ({
        name: replacePlaceholders(f.name, context),
        value: replacePlaceholders(f.value, context),
        inline: f.inline,
      })),
    };
  }

  // If no custom message, send a default one
  if (!content && !embed) {
    embed = {
      title: `Ticket #${context.ticket.number.toString().padStart(4, "0")}`,
      description: `Welcome ${context.user.mention}!\n\nA staff member will assist you shortly. Please describe your issue in detail.`,
      color: 0x5865f2, // Discord blurple
      fields: [],
    };

    // Add modal responses to embed if present
    if (modalResponses && modalResponses.length > 0) {
      embed.fields = modalResponses.map((r) => ({
        name: r.label,
        value: r.value || "*No response*",
        inline: false,
      }));
    }
  }

  // Build action row with close button
  const actionRow: APIActionRowComponent<APIButtonComponent> = {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        style: ButtonStyle.Danger,
        label: "Close Ticket",
        custom_id: `ticket:close:${ticketId}`,
        emoji: { name: "🔒" },
      },
      {
        type: ComponentType.Button,
        style: ButtonStyle.Secondary,
        label: "Claim",
        custom_id: `ticket:claim:${ticketId}`,
        emoji: { name: "✋" },
      },
    ],
  };

  const message = (await rest.post(Routes.channelMessages(channelId), {
    body: {
      content,
      embeds: embed ? [embed] : undefined,
      components: [actionRow],
    },
  })) as APIMessage;

  return message;
}

export async function canUserCreateTicket(
  guildId: string,
  userId: string,
  serverSettings: Doc<"serverSettings">
): Promise<{ allowed: boolean; reason?: string }> {
  // Check blacklist
  if (serverSettings.blacklistedUserIds.includes(userId)) {
    return { allowed: false, reason: "You are not allowed to create tickets in this server." };
  }

  // Check max open tickets
  const openTicketCount = await convex.query(api.tickets.countOpenByUser, {
    guildId,
    userId,
  });

  if (openTicketCount >= serverSettings.maxOpenTicketsPerUser) {
    return {
      allowed: false,
      reason: `You already have ${openTicketCount} open ticket(s). Maximum allowed: ${serverSettings.maxOpenTicketsPerUser}`,
    };
  }

  // Check cooldown
  if (serverSettings.ticketCooldownSeconds > 0) {
    const lastTicket = await convex.query(api.tickets.getLastTicketByUser, {
      guildId,
      userId,
    });

    if (lastTicket) {
      const cooldownMs = serverSettings.ticketCooldownSeconds * 1000;
      const timeSinceLastTicket = Date.now() - lastTicket.createdAt;

      if (timeSinceLastTicket < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastTicket) / 1000);
        return {
          allowed: false,
          reason: `Please wait ${remainingSeconds} second(s) before creating another ticket.`,
        };
      }
    }
  }

  return { allowed: true };
}
