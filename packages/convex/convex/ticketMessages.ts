import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const attachmentValidator = v.object({
  id: v.string(),
  filename: v.string(),
  url: v.string(),
  contentType: v.optional(v.string()),
  size: v.number(),
});

const embedFieldValidator = v.object({
  name: v.string(),
  value: v.string(),
  inline: v.optional(v.boolean()),
});

const embedValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  color: v.optional(v.number()),
  footer: v.optional(v.object({
    text: v.string(),
    icon_url: v.optional(v.string()),
  })),
  thumbnail: v.optional(v.object({ url: v.string() })),
  image: v.optional(v.object({ url: v.string() })),
  fields: v.optional(v.array(embedFieldValidator)),
});

export const recordSend = mutation({
  args: {
    ticketId: v.id("tickets"),
    messageId: v.string(),
    authorId: v.string(),
    authorUsername: v.string(),
    authorDisplayName: v.optional(v.string()),
    authorAvatarHash: v.optional(v.string()),
    content: v.string(),
    attachments: v.optional(v.array(attachmentValidator)),
    embeds: v.optional(v.array(embedValidator)),
    isSystemMessage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ticketMessageActions", {
      ticketId: args.ticketId,
      messageId: args.messageId,
      authorId: args.authorId,
      authorUsername: args.authorUsername,
      authorDisplayName: args.authorDisplayName,
      authorAvatarHash: args.authorAvatarHash,
      action: "send",
      content: args.content,
      attachments: args.attachments,
      embeds: args.embeds,
      isSystemMessage: args.isSystemMessage ?? false,
      actionAt: Date.now(),
    });
  },
});

export const recordEdit = mutation({
  args: {
    ticketId: v.id("tickets"),
    messageId: v.string(),
    authorId: v.string(),
    authorUsername: v.string(),
    authorDisplayName: v.optional(v.string()),
    authorAvatarHash: v.optional(v.string()),
    content: v.string(),
    attachments: v.optional(v.array(attachmentValidator)),
    embeds: v.optional(v.array(embedValidator)),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ticketMessageActions", {
      ticketId: args.ticketId,
      messageId: args.messageId,
      authorId: args.authorId,
      authorUsername: args.authorUsername,
      authorDisplayName: args.authorDisplayName,
      authorAvatarHash: args.authorAvatarHash,
      action: "edit",
      content: args.content,
      attachments: args.attachments,
      embeds: args.embeds,
      isSystemMessage: false,
      actionAt: Date.now(),
    });
  },
});

export const recordDelete = mutation({
  args: {
    ticketId: v.id("tickets"),
    messageId: v.string(),
    authorId: v.string(),
    authorUsername: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ticketMessageActions", {
      ticketId: args.ticketId,
      messageId: args.messageId,
      authorId: args.authorId,
      authorUsername: args.authorUsername,
      action: "delete",
      isSystemMessage: false,
      actionAt: Date.now(),
    });
  },
});

export const listByTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketMessageActions")
      .withIndex("by_ticket_action_time", (q) => q.eq("ticketId", args.ticketId))
      .collect();
  },
});

// Reconstructs the message history from event-sourced actions
export const getReconstructedMessages = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("ticketMessageActions")
      .withIndex("by_ticket_action_time", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Group actions by messageId
    const messageMap = new Map<string, {
      messageId: string;
      authorId: string;
      authorUsername: string;
      authorDisplayName?: string;
      authorAvatarHash?: string;
      currentContent?: string;
      originalContent?: string;
      attachments?: typeof actions[0]["attachments"];
      embeds?: typeof actions[0]["embeds"];
      isDeleted: boolean;
      isEdited: boolean;
      isSystemMessage: boolean;
      createdAt: number;
      editHistory: Array<{ content: string; editedAt: number }>;
      deletedAt?: number;
    }>();

    for (const action of actions) {
      const existing = messageMap.get(action.messageId);

      if (action.action === "send") {
        messageMap.set(action.messageId, {
          messageId: action.messageId,
          authorId: action.authorId,
          authorUsername: action.authorUsername,
          authorDisplayName: action.authorDisplayName,
          authorAvatarHash: action.authorAvatarHash,
          currentContent: action.content,
          originalContent: action.content,
          attachments: action.attachments,
          embeds: action.embeds,
          isDeleted: false,
          isEdited: false,
          isSystemMessage: action.isSystemMessage,
          createdAt: action.actionAt,
          editHistory: [],
        });
      } else if (action.action === "edit" && existing) {
        // Store the previous content in edit history
        if (existing.currentContent) {
          existing.editHistory.push({
            content: existing.currentContent,
            editedAt: action.actionAt,
          });
        }
        existing.currentContent = action.content;
        existing.isEdited = true;
        if (action.attachments) existing.attachments = action.attachments;
        if (action.embeds) existing.embeds = action.embeds;
      } else if (action.action === "delete" && existing) {
        existing.isDeleted = true;
        existing.deletedAt = action.actionAt;
      }
    }

    // Convert to array and sort by creation time
    return Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get the last message action for a specific message (to check if we already have it)
export const getLastActionForMessage = query({
  args: {
    ticketId: v.id("tickets"),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("ticketMessageActions")
      .withIndex("by_ticket_message", (q) =>
        q.eq("ticketId", args.ticketId).eq("messageId", args.messageId)
      )
      .collect();

    if (actions.length === 0) return null;
    return actions[actions.length - 1];
  },
});
