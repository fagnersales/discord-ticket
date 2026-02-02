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

// Panel queries
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

// Get panel by message ID (through panelMessages)
export const getByMessageId = query({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    const panelMessage = await ctx.db
      .query("panelMessages")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .unique();

    if (!panelMessage) return null;

    const panel = await ctx.db.get(panelMessage.panelId);
    return panel;
  },
});

// Panel mutations
export const create = mutation({
  args: {
    guildId: v.string(),
    name: v.string(),
    embed: embedValidator,
    style: v.union(v.literal("buttons"), v.literal("dropdown")),
    optionIds: v.array(v.id("ticketOptions")),
    dropdownPlaceholder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ticketPanels", {
      guildId: args.guildId,
      name: args.name,
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
    name: v.optional(v.string()),
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

export const remove = mutation({
  args: { id: v.id("ticketPanels") },
  handler: async (ctx, args) => {
    // Also remove all panel messages
    const panelMessages = await ctx.db
      .query("panelMessages")
      .withIndex("by_panel", (q) => q.eq("panelId", args.id))
      .collect();

    await Promise.all(panelMessages.map((pm) => ctx.db.delete(pm._id)));

    await ctx.db.delete(args.id);
  },
});

// Panel message queries
export const listMessagesByPanel = query({
  args: { panelId: v.id("ticketPanels") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("panelMessages")
      .withIndex("by_panel", (q) => q.eq("panelId", args.panelId))
      .collect();
  },
});

export const listMessagesByGuild = query({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("panelMessages")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();
  },
});

export const getPanelMessage = query({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("panelMessages")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .unique();
  },
});

export const getPanelMessageById = query({
  args: { id: v.id("panelMessages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Panel message mutations
export const addMessage = mutation({
  args: {
    panelId: v.id("ticketPanels"),
    guildId: v.string(),
    channelId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("panelMessages", {
      panelId: args.panelId,
      guildId: args.guildId,
      channelId: args.channelId,
      messageId: args.messageId,
      postedAt: Date.now(),
    });
  },
});

export const removeMessage = mutation({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    const panelMessage = await ctx.db
      .query("panelMessages")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .unique();

    if (panelMessage) {
      await ctx.db.delete(panelMessage._id);
    }
  },
});

export const removeMessageById = mutation({
  args: { id: v.id("panelMessages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
