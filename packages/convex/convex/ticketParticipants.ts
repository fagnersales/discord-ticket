import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketParticipants")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
  },
});

export const getByTicketAndUser = query({
  args: {
    ticketId: v.id("tickets"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketParticipants")
      .withIndex("by_ticket_user", (q) =>
        q.eq("ticketId", args.ticketId).eq("userId", args.userId)
      )
      .unique();
  },
});

export const upsertOnMessage = mutation({
  args: {
    ticketId: v.id("tickets"),
    userId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarHash: v.optional(v.string()),
    isStaff: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ticketParticipants")
      .withIndex("by_ticket_user", (q) =>
        q.eq("ticketId", args.ticketId).eq("userId", args.userId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        displayName: args.displayName,
        avatarHash: args.avatarHash,
        messageCount: existing.messageCount + 1,
        lastMessageAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("ticketParticipants", {
      ticketId: args.ticketId,
      userId: args.userId,
      username: args.username,
      displayName: args.displayName,
      avatarHash: args.avatarHash,
      messageCount: 1,
      firstMessageAt: now,
      lastMessageAt: now,
      isStaff: args.isStaff,
    });
  },
});
