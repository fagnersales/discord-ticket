import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const listByGuild = query({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketPanels")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("ticketPanels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByMessageId = query({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketPanels")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .unique();
  },
});

export const create = mutation({
  args: {
    guildId: v.string(),
    channelId: v.string(),
    embed: embedValidator,
    style: v.union(v.literal("buttons"), v.literal("dropdown")),
    optionIds: v.array(v.id("ticketOptions")),
    dropdownPlaceholder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ticketPanels", {
      guildId: args.guildId,
      channelId: args.channelId,
      embed: args.embed,
      style: args.style,
      optionIds: args.optionIds,
      dropdownPlaceholder: args.dropdownPlaceholder,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("ticketPanels"),
    channelId: v.optional(v.string()),
    embed: v.optional(embedValidator),
    style: v.optional(v.union(v.literal("buttons"), v.literal("dropdown"))),
    optionIds: v.optional(v.array(v.id("ticketOptions"))),
    dropdownPlaceholder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const setMessageId = mutation({
  args: {
    id: v.id("ticketPanels"),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { messageId: args.messageId });
  },
});

export const remove = mutation({
  args: { id: v.id("ticketPanels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
