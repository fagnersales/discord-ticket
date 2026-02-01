import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const modalFieldValidator = v.object({
  id: v.string(),
  label: v.string(),
  placeholder: v.optional(v.string()),
  style: v.union(v.literal("short"), v.literal("paragraph")),
  required: v.boolean(),
  minLength: v.optional(v.number()),
  maxLength: v.optional(v.number()),
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

export const listByGuild = query({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketOptions")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();
  },
});

export const listEnabledByGuild = query({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("ticketOptions")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();
    return options.filter((o) => o.enabled).sort((a, b) => a.order - b.order);
  },
});

export const get = query({
  args: { id: v.id("ticketOptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    guildId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    channelNameTemplate: v.string(),
    categoryId: v.optional(v.string()),
    responsibleRoleIds: v.array(v.string()),
    useModal: v.boolean(),
    modalTitle: v.optional(v.string()),
    modalFields: v.optional(v.array(modalFieldValidator)),
    initialMessage: v.optional(v.object({
      content: v.optional(v.string()),
      embed: v.optional(embedValidator),
    })),
  },
  handler: async (ctx, args) => {
    // Get the next order number
    const existing = await ctx.db
      .query("ticketOptions")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();
    const maxOrder = existing.reduce((max, o) => Math.max(max, o.order), -1);

    return await ctx.db.insert("ticketOptions", {
      guildId: args.guildId,
      name: args.name,
      description: args.description,
      emoji: args.emoji,
      channelNameTemplate: args.channelNameTemplate,
      categoryId: args.categoryId,
      responsibleRoleIds: args.responsibleRoleIds,
      useModal: args.useModal,
      modalTitle: args.modalTitle,
      modalFields: args.modalFields,
      initialMessage: args.initialMessage,
      order: maxOrder + 1,
      enabled: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("ticketOptions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    channelNameTemplate: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    responsibleRoleIds: v.optional(v.array(v.string())),
    useModal: v.optional(v.boolean()),
    modalTitle: v.optional(v.string()),
    modalFields: v.optional(v.array(modalFieldValidator)),
    initialMessage: v.optional(v.object({
      content: v.optional(v.string()),
      embed: v.optional(embedValidator),
    })),
    enabled: v.optional(v.boolean()),
    order: v.optional(v.number()),
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
  args: { id: v.id("ticketOptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    guildId: v.string(),
    orderedIds: v.array(v.id("ticketOptions")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});
