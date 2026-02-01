import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  servers: defineTable({
    discordGuildId: v.string(),
    ownerId: v.string(),
    ticketCategoryId: v.optional(v.string()),
    supportRoleId: v.optional(v.string()),
    logChannelId: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    settings: v.object({
      autoClose: v.boolean(),
      autoCloseHours: v.optional(v.number()),
      transcriptEnabled: v.boolean(),
    }),
  }).index("by_guild", ["discordGuildId"]),

  tickets: defineTable({
    serverId: v.id("servers"),
    discordUserId: v.string(),
    discordChannelId: v.string(),
    subject: v.string(),
    status: v.union(v.literal("open"), v.literal("pending"), v.literal("closed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignedTo: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_server", ["serverId"])
    .index("by_channel", ["discordChannelId"])
    .index("by_status", ["status"]),

  messages: defineTable({
    ticketId: v.id("tickets"),
    discordUserId: v.string(),
    discordMessageId: v.string(),
    content: v.string(),
    isStaffReply: v.boolean(),
    createdAt: v.number(),
  }).index("by_ticket", ["ticketId"]),
});
