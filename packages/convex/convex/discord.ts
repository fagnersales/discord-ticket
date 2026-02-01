import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Validators for channel types
const textChannelValidator = v.object({
  channelType: v.literal("text"),
  guildId: v.string(),
  channelId: v.string(),
  name: v.string(),
  topic: v.optional(v.string()),
  nsfw: v.boolean(),
  rateLimitPerUser: v.number(),
  parentId: v.optional(v.string()),
  position: v.number(),
});

const voiceChannelValidator = v.object({
  channelType: v.literal("voice"),
  guildId: v.string(),
  channelId: v.string(),
  name: v.string(),
  bitrate: v.number(),
  userLimit: v.number(),
  rtcRegion: v.optional(v.string()),
  parentId: v.optional(v.string()),
  position: v.number(),
});

const categoryChannelValidator = v.object({
  channelType: v.literal("category"),
  guildId: v.string(),
  channelId: v.string(),
  name: v.string(),
  parentId: v.optional(v.string()),
  position: v.number(),
});

const channelValidator = v.union(
  textChannelValidator,
  voiceChannelValidator,
  categoryChannelValidator,
);

const roleValidator = v.object({
  guildId: v.string(),
  roleId: v.string(),
  name: v.string(),
  color: v.number(),
  hoist: v.boolean(),
  position: v.number(),
  permissions: v.string(),
  managed: v.boolean(),
  mentionable: v.boolean(),
});

const memberValidator = v.object({
  guildId: v.string(),
  userId: v.string(),
  username: v.string(),
  displayName: v.optional(v.string()),
  avatarHash: v.optional(v.string()),
  roles: v.array(v.string()),
  joinedAt: v.optional(v.number()),
});

const emojiValidator = v.object({
  guildId: v.string(),
  emojiId: v.string(),
  name: v.string(),
  animated: v.boolean(),
  imageUrl: v.string(),
  source: v.union(v.literal("guild"), v.literal("application")),
});

const serverValidator = v.object({
  guildId: v.string(),
  name: v.string(),
  iconHash: v.optional(v.string()),
  ownerId: v.optional(v.string()),
  memberCount: v.optional(v.number()),
});

// Server mutations
export const upsertServer = mutation({
  args: { server: serverValidator },
  returns: v.null(),
  handler: async (ctx, { server }) => {
    const existing = await ctx.db
      .query("discordServers")
      .withIndex("by_guild", (q) => q.eq("guildId", server.guildId))
      .unique();

    const data = { ...server, lastUpdated: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("discordServers", data);
    }
    return null;
  },
});

export const getServer = query({
  args: { guildId: v.string() },
  handler: async (ctx, { guildId }) => {
    return await ctx.db
      .query("discordServers")
      .withIndex("by_guild", (q) => q.eq("guildId", guildId))
      .unique();
  },
});

// Channel mutations
export const upsertChannel = mutation({
  args: { channel: channelValidator },
  returns: v.null(),
  handler: async (ctx, { channel }) => {
    const existing = await ctx.db
      .query("discordChannels")
      .withIndex("by_guild_channel", (q) =>
        q.eq("guildId", channel.guildId).eq("channelId", channel.channelId),
      )
      .unique();

    const data = { ...channel, lastUpdated: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("discordChannels", data);
    }
    return null;
  },
});

export const deleteChannel = mutation({
  args: { guildId: v.string(), channelId: v.string() },
  returns: v.null(),
  handler: async (ctx, { guildId, channelId }) => {
    const existing = await ctx.db
      .query("discordChannels")
      .withIndex("by_guild_channel", (q) =>
        q.eq("guildId", guildId).eq("channelId", channelId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const listChannels = query({
  args: { guildId: v.string() },
  handler: async (ctx, { guildId }) => {
    return await ctx.db
      .query("discordChannels")
      .withIndex("by_guild", (q) => q.eq("guildId", guildId))
      .collect();
  },
});

// Role mutations
export const upsertRole = mutation({
  args: { role: roleValidator },
  returns: v.null(),
  handler: async (ctx, { role }) => {
    const existing = await ctx.db
      .query("discordRoles")
      .withIndex("by_guild_role", (q) =>
        q.eq("guildId", role.guildId).eq("roleId", role.roleId),
      )
      .unique();

    const data = { ...role, lastUpdated: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("discordRoles", data);
    }
    return null;
  },
});

export const deleteRole = mutation({
  args: { guildId: v.string(), roleId: v.string() },
  returns: v.null(),
  handler: async (ctx, { guildId, roleId }) => {
    const existing = await ctx.db
      .query("discordRoles")
      .withIndex("by_guild_role", (q) =>
        q.eq("guildId", guildId).eq("roleId", roleId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const listRoles = query({
  args: { guildId: v.string() },
  handler: async (ctx, { guildId }) => {
    return await ctx.db
      .query("discordRoles")
      .withIndex("by_guild", (q) => q.eq("guildId", guildId))
      .collect();
  },
});

// Member mutations
export const upsertMember = mutation({
  args: { member: memberValidator },
  returns: v.null(),
  handler: async (ctx, { member }) => {
    const existing = await ctx.db
      .query("discordMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", member.guildId).eq("userId", member.userId),
      )
      .unique();

    const data = { ...member, lastUpdated: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("discordMembers", data);
    }
    return null;
  },
});

export const deleteMember = mutation({
  args: { guildId: v.string(), userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { guildId, userId }) => {
    const existing = await ctx.db
      .query("discordMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", guildId).eq("userId", userId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const listMembers = query({
  args: { guildId: v.string() },
  handler: async (ctx, { guildId }) => {
    return await ctx.db
      .query("discordMembers")
      .withIndex("by_guild", (q) => q.eq("guildId", guildId))
      .collect();
  },
});

// Emoji mutations
export const upsertEmoji = mutation({
  args: { emoji: emojiValidator },
  returns: v.null(),
  handler: async (ctx, { emoji }) => {
    const existing = await ctx.db
      .query("discordEmojis")
      .withIndex("by_guild_emoji", (q) =>
        q.eq("guildId", emoji.guildId).eq("emojiId", emoji.emojiId),
      )
      .unique();

    const data = { ...emoji, lastUpdated: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("discordEmojis", data);
    }
    return null;
  },
});

export const deleteEmoji = mutation({
  args: { guildId: v.string(), emojiId: v.string() },
  returns: v.null(),
  handler: async (ctx, { guildId, emojiId }) => {
    const existing = await ctx.db
      .query("discordEmojis")
      .withIndex("by_guild_emoji", (q) =>
        q.eq("guildId", guildId).eq("emojiId", emojiId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const listEmojis = query({
  args: { guildId: v.string() },
  handler: async (ctx, { guildId }) => {
    return await ctx.db
      .query("discordEmojis")
      .withIndex("by_guild", (q) => q.eq("guildId", guildId))
      .collect();
  },
});

export const listEmojisBySource = query({
  args: {
    guildId: v.string(),
    source: v.union(v.literal("guild"), v.literal("application")),
  },
  handler: async (ctx, { guildId, source }) => {
    return await ctx.db
      .query("discordEmojis")
      .withIndex("by_guild_source", (q) =>
        q.eq("guildId", guildId).eq("source", source),
      )
      .collect();
  },
});
