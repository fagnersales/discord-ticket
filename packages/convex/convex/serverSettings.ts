import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByGuildId = query({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("serverSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    guildId: v.string(),
    ownerId: v.string(),
    staffRoleIds: v.optional(v.array(v.string())),
    adminRoleIds: v.optional(v.array(v.string())),
    ticketCategoryId: v.optional(v.string()),
    fallbackCategoryId: v.optional(v.string()),
    logChannelId: v.optional(v.string()),
    maxOpenTicketsPerUser: v.optional(v.number()),
    ticketCooldownSeconds: v.optional(v.number()),
    allowUserClose: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serverSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ownerId: args.ownerId,
        ...(args.staffRoleIds !== undefined && { staffRoleIds: args.staffRoleIds }),
        ...(args.adminRoleIds !== undefined && { adminRoleIds: args.adminRoleIds }),
        ...(args.ticketCategoryId !== undefined && { ticketCategoryId: args.ticketCategoryId }),
        ...(args.fallbackCategoryId !== undefined && { fallbackCategoryId: args.fallbackCategoryId }),
        ...(args.logChannelId !== undefined && { logChannelId: args.logChannelId }),
        ...(args.maxOpenTicketsPerUser !== undefined && { maxOpenTicketsPerUser: args.maxOpenTicketsPerUser }),
        ...(args.ticketCooldownSeconds !== undefined && { ticketCooldownSeconds: args.ticketCooldownSeconds }),
        ...(args.allowUserClose !== undefined && { allowUserClose: args.allowUserClose }),
      });
      return existing._id;
    }

    return await ctx.db.insert("serverSettings", {
      guildId: args.guildId,
      ownerId: args.ownerId,
      staffRoleIds: args.staffRoleIds ?? [],
      adminRoleIds: args.adminRoleIds ?? [],
      ticketCategoryId: args.ticketCategoryId,
      fallbackCategoryId: args.fallbackCategoryId,
      logChannelId: args.logChannelId,
      maxOpenTicketsPerUser: args.maxOpenTicketsPerUser ?? 3,
      ticketCooldownSeconds: args.ticketCooldownSeconds ?? 0,
      blacklistedUserIds: [],
      allowUserClose: args.allowUserClose ?? false,
      ticketCounter: 0,
    });
  },
});

export const addToBlacklist = mutation({
  args: {
    guildId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("serverSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (!settings) {
      throw new Error("Server settings not found");
    }

    if (!settings.blacklistedUserIds.includes(args.userId)) {
      await ctx.db.patch(settings._id, {
        blacklistedUserIds: [...settings.blacklistedUserIds, args.userId],
      });
    }
  },
});

export const removeFromBlacklist = mutation({
  args: {
    guildId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("serverSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (!settings) {
      throw new Error("Server settings not found");
    }

    await ctx.db.patch(settings._id, {
      blacklistedUserIds: settings.blacklistedUserIds.filter((id) => id !== args.userId),
    });
  },
});

export const incrementTicketCounter = mutation({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("serverSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (!settings) {
      throw new Error("Server settings not found");
    }

    const newCounter = settings.ticketCounter + 1;
    await ctx.db.patch(settings._id, { ticketCounter: newCounter });
    return newCounter;
  },
});

export const isUserBlacklisted = query({
  args: {
    guildId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("serverSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (!settings) return false;
    return settings.blacklistedUserIds.includes(args.userId);
  },
});

export const canUserCloseTicket = query({
  args: {
    guildId: v.string(),
    ticketId: v.id("tickets"),
    userId: v.string(),
    userRoleIds: v.array(v.string()),
  },
  returns: v.object({
    allowed: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("serverSettings")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (!settings) {
      return { allowed: false, reason: "Server not configured" };
    }

    // Check if user is staff or admin
    const isStaff = args.userRoleIds.some(
      (roleId) =>
        settings.staffRoleIds.includes(roleId) ||
        settings.adminRoleIds.includes(roleId)
    );

    if (isStaff) {
      return { allowed: true };
    }

    // Check if user is the ticket creator and allowUserClose is enabled
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return { allowed: false, reason: "Ticket not found" };
    }

    const isCreator = ticket.creatorId === args.userId;

    if (isCreator && settings.allowUserClose) {
      return { allowed: true };
    }

    if (isCreator && !settings.allowUserClose) {
      return { allowed: false, reason: "Only staff can close tickets" };
    }

    return { allowed: false, reason: "You don't have permission to close this ticket" };
  },
});
