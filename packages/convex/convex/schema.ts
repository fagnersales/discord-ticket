import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable validators
const discordSnowflake = v.string();

const modalField = v.object({
  id: v.string(),
  label: v.string(),
  placeholder: v.optional(v.string()),
  style: v.union(v.literal("short"), v.literal("paragraph")),
  required: v.boolean(),
  minLength: v.optional(v.number()),
  maxLength: v.optional(v.number()),
});

const embedField = v.object({
  name: v.string(),
  value: v.string(),
  inline: v.optional(v.boolean()),
});

const embedData = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  color: v.optional(v.number()),
  footer: v.optional(v.object({
    text: v.string(),
    icon_url: v.optional(v.string()),
  })),
  thumbnail: v.optional(v.object({ url: v.string() })),
  image: v.optional(v.object({ url: v.string() })),
  fields: v.optional(v.array(embedField)),
});

export default defineSchema({
  // Server-level configuration
  serverSettings: defineTable({
    guildId: discordSnowflake,
    ownerId: discordSnowflake,

    // Staff configuration
    staffRoleIds: v.array(discordSnowflake),
    adminRoleIds: v.array(discordSnowflake),

    // Channel configuration
    ticketCategoryId: v.optional(discordSnowflake),
    fallbackCategoryId: v.optional(discordSnowflake),
    logChannelId: v.optional(discordSnowflake),

    // Limits and restrictions
    maxOpenTicketsPerUser: v.number(),
    ticketCooldownSeconds: v.number(),
    blacklistedUserIds: v.array(discordSnowflake),

    // Permissions
    allowUserClose: v.boolean(), // Can users close their own tickets?

    // Counter for ticket numbering
    ticketCounter: v.number(),
  })
    .index("by_guild", ["guildId"]),

  // Ticket category options (e.g., "Support", "Sales", "Bug Report")
  ticketOptions: defineTable({
    guildId: discordSnowflake,

    // Display
    name: v.string(),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),

    // Channel settings
    channelNameTemplate: v.string(), // e.g., "ticket-{ticketNumber}" or "{username}-{option}"
    categoryId: v.optional(discordSnowflake), // Override server default

    // Permissions
    responsibleRoleIds: v.array(discordSnowflake), // Roles that can see this ticket type

    // Modal configuration (optional)
    useModal: v.boolean(),
    modalTitle: v.optional(v.string()),
    modalFields: v.optional(v.array(modalField)),
    showModalResponses: v.optional(v.boolean()), // Show modal responses in a separate embed

    // Initial message sent when ticket is created
    initialMessage: v.optional(v.object({
      content: v.optional(v.string()),
      embed: v.optional(embedData),
    })),

    // Order for display
    order: v.number(),

    // Whether this option is active
    enabled: v.boolean(),
  })
    .index("by_guild", ["guildId"])
    .index("by_guild_order", ["guildId", "order"]),

  // Panel configurations (reusable templates)
  ticketPanels: defineTable({
    guildId: discordSnowflake,

    // Panel name for identification in dashboard
    name: v.string(),

    // Panel content
    embed: embedData,

    // Interaction style
    style: v.union(v.literal("buttons"), v.literal("dropdown")),

    // Which ticket options are available on this panel
    optionIds: v.array(v.id("ticketOptions")),

    // For dropdown: placeholder text
    dropdownPlaceholder: v.optional(v.string()),
  })
    .index("by_guild", ["guildId"]),

  // Posted panel messages (references to Discord messages)
  panelMessages: defineTable({
    panelId: v.id("ticketPanels"),
    guildId: discordSnowflake,
    channelId: discordSnowflake,
    messageId: discordSnowflake,
    postedAt: v.number(),
  })
    .index("by_panel", ["panelId"])
    .index("by_guild", ["guildId"])
    .index("by_message", ["messageId"])
    .index("by_channel_message", ["channelId", "messageId"]),

  // Individual tickets
  tickets: defineTable({
    guildId: discordSnowflake,
    channelId: discordSnowflake,

    // Ticket metadata
    ticketNumber: v.number(),
    optionId: v.id("ticketOptions"),

    // Creator
    creatorId: discordSnowflake,
    creatorUsername: v.string(),

    // Modal responses (if ticket option uses modal)
    modalResponses: v.optional(v.array(v.object({
      fieldId: v.string(),
      label: v.string(),
      value: v.string(),
    }))),

    // Status
    status: v.union(
      v.literal("open"),
      v.literal("closed")
    ),

    // Priority
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),

    // Users who have been added/removed from ticket
    addedUserIds: v.array(discordSnowflake),
    removedUserIds: v.array(discordSnowflake),

    // Closure info
    closedAt: v.optional(v.number()),
    closedById: v.optional(discordSnowflake),
    closeReason: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_guild", ["guildId"])
    .index("by_channel", ["channelId"])
    .index("by_guild_status", ["guildId", "status"])
    .index("by_guild_creator", ["guildId", "creatorId"])
    .index("by_guild_number", ["guildId", "ticketNumber"]),

  // Track users who have participated in tickets (sent messages)
  ticketParticipants: defineTable({
    ticketId: v.id("tickets"),

    userId: discordSnowflake,
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarHash: v.optional(v.string()),

    // Stats
    messageCount: v.number(),
    firstMessageAt: v.number(),
    lastMessageAt: v.number(),

    // Whether this user is staff
    isStaff: v.boolean(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_ticket_user", ["ticketId", "userId"]),

  // Event-sourced message tracking
  ticketMessageActions: defineTable({
    ticketId: v.id("tickets"),

    // Discord IDs
    messageId: discordSnowflake,
    authorId: discordSnowflake,
    authorUsername: v.string(),
    authorDisplayName: v.optional(v.string()),
    authorAvatarHash: v.optional(v.string()),

    // Action type
    action: v.union(
      v.literal("send"),
      v.literal("edit"),
      v.literal("delete")
    ),

    // Content (for send/edit actions)
    content: v.optional(v.string()),

    // Attachments (stored as URLs)
    attachments: v.optional(v.array(v.object({
      id: v.string(),
      filename: v.string(),
      url: v.string(),
      contentType: v.optional(v.string()),
      size: v.number(),
    }))),

    // Embeds (for bot messages)
    embeds: v.optional(v.array(embedData)),

    // Whether this is a system message (ticket created, user added, etc.)
    isSystemMessage: v.boolean(),

    // Timestamp of the action
    actionAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_ticket_message", ["ticketId", "messageId"])
    .index("by_message", ["messageId"])
    .index("by_ticket_action_time", ["ticketId", "actionAt"]),

  // Synced Discord servers
  discordServers: defineTable({
    guildId: discordSnowflake,
    name: v.string(),
    iconHash: v.optional(v.string()),
    ownerId: v.optional(discordSnowflake),
    memberCount: v.optional(v.number()),
    lastUpdated: v.number(),
  }).index("by_guild", ["guildId"]),

  // Synced Discord channels (union type for text/voice/category)
  discordChannels: defineTable(
    v.union(
      v.object({
        channelType: v.literal("text"),
        guildId: discordSnowflake,
        channelId: discordSnowflake,
        name: v.string(),
        topic: v.optional(v.string()),
        nsfw: v.boolean(),
        rateLimitPerUser: v.number(),
        parentId: v.optional(discordSnowflake),
        position: v.number(),
        lastUpdated: v.number(),
      }),
      v.object({
        channelType: v.literal("voice"),
        guildId: discordSnowflake,
        channelId: discordSnowflake,
        name: v.string(),
        bitrate: v.number(),
        userLimit: v.number(),
        rtcRegion: v.optional(v.string()),
        parentId: v.optional(discordSnowflake),
        position: v.number(),
        lastUpdated: v.number(),
      }),
      v.object({
        channelType: v.literal("category"),
        guildId: discordSnowflake,
        channelId: discordSnowflake,
        name: v.string(),
        parentId: v.optional(discordSnowflake),
        position: v.number(),
        lastUpdated: v.number(),
      }),
    ),
  )
    .index("by_guild", ["guildId"])
    .index("by_guild_channel", ["guildId", "channelId"]),

  // Synced Discord roles
  discordRoles: defineTable({
    guildId: discordSnowflake,
    roleId: discordSnowflake,
    name: v.string(),
    color: v.number(),
    hoist: v.boolean(),
    position: v.number(),
    permissions: v.string(),
    managed: v.boolean(),
    mentionable: v.boolean(),
    lastUpdated: v.number(),
  })
    .index("by_guild", ["guildId"])
    .index("by_guild_role", ["guildId", "roleId"]),

  // Synced Discord members
  discordMembers: defineTable({
    guildId: discordSnowflake,
    userId: discordSnowflake,
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarHash: v.optional(v.string()),
    roles: v.array(discordSnowflake),
    joinedAt: v.optional(v.number()),
    lastUpdated: v.number(),
  })
    .index("by_guild", ["guildId"])
    .index("by_guild_user", ["guildId", "userId"]),

  // Synced Discord emojis
  discordEmojis: defineTable({
    guildId: discordSnowflake,
    emojiId: discordSnowflake,
    name: v.string(),
    animated: v.boolean(),
    imageUrl: v.string(),
    source: v.union(v.literal("guild"), v.literal("application")),
    lastUpdated: v.number(),
  })
    .index("by_guild", ["guildId"])
    .index("by_guild_emoji", ["guildId", "emojiId"])
    .index("by_guild_source", ["guildId", "source"]),
});
