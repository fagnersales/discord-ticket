import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByChannelId = query({
  args: { channelId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .unique();
  },
});

export const get = query({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByGuild = query({
  args: {
    guildId: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("tickets")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId));

    const tickets = await query.collect();
    let filtered = tickets;

    if (args.status) {
      filtered = tickets.filter((t) => t.status === args.status);
    }

    // Sort by creation time, newest first
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

export const listOpenByUser = query({
  args: {
    guildId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_guild_creator", (q) =>
        q.eq("guildId", args.guildId).eq("creatorId", args.userId)
      )
      .collect();

    return tickets.filter((t) => t.status === "open");
  },
});

export const countOpenByUser = query({
  args: {
    guildId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_guild_creator", (q) =>
        q.eq("guildId", args.guildId).eq("creatorId", args.userId)
      )
      .collect();

    return tickets.filter((t) => t.status === "open").length;
  },
});

export const create = mutation({
  args: {
    guildId: v.string(),
    channelId: v.string(),
    ticketNumber: v.number(),
    optionId: v.id("ticketOptions"),
    creatorId: v.string(),
    creatorUsername: v.string(),
    modalResponses: v.optional(v.array(v.object({
      fieldId: v.string(),
      label: v.string(),
      value: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", {
      guildId: args.guildId,
      channelId: args.channelId,
      ticketNumber: args.ticketNumber,
      optionId: args.optionId,
      creatorId: args.creatorId,
      creatorUsername: args.creatorUsername,
      modalResponses: args.modalResponses,
      status: "open",
      priority: "normal",
      addedUserIds: [],
      removedUserIds: [],
      createdAt: Date.now(),
    });
  },
});

export const close = mutation({
  args: {
    id: v.id("tickets"),
    closedById: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "closed",
      closedAt: Date.now(),
      closedById: args.closedById,
      closeReason: args.reason,
    });
  },
});

export const reopen = mutation({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "open",
      closedAt: undefined,
      closedById: undefined,
      closeReason: undefined,
    });
  },
});

export const setPriority = mutation({
  args: {
    id: v.id("tickets"),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { priority: args.priority });
  },
});

export const addUser = mutation({
  args: {
    id: v.id("tickets"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");

    if (!ticket.addedUserIds.includes(args.userId)) {
      await ctx.db.patch(args.id, {
        addedUserIds: [...ticket.addedUserIds, args.userId],
        removedUserIds: ticket.removedUserIds.filter((id) => id !== args.userId),
      });
    }
  },
});

export const removeUser = mutation({
  args: {
    id: v.id("tickets"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");

    if (!ticket.removedUserIds.includes(args.userId)) {
      await ctx.db.patch(args.id, {
        addedUserIds: ticket.addedUserIds.filter((id) => id !== args.userId),
        removedUserIds: [...ticket.removedUserIds, args.userId],
      });
    }
  },
});

export const markClosedByChannelDeletion = mutation({
  args: { channelId: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .unique();

    if (ticket && ticket.status === "open") {
      await ctx.db.patch(ticket._id, {
        status: "closed",
        closedAt: Date.now(),
        closeReason: "Channel deleted",
      });
    }
  },
});

// Get the most recent ticket by a user (for cooldown checking)
export const getLastTicketByUser = query({
  args: {
    guildId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_guild_creator", (q) =>
        q.eq("guildId", args.guildId).eq("creatorId", args.userId)
      )
      .collect();

    if (tickets.length === 0) return null;

    // Return the most recent ticket
    return tickets.sort((a, b) => b.createdAt - a.createdAt)[0];
  },
});
