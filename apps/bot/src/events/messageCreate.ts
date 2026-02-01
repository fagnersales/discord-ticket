import type { APIMessage } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleMessageCreate(message: APIMessage) {
  // Ignore DMs
  if (!message.guild_id) return;

  // Check if this is a ticket channel
  const ticket = await convex.query(api.tickets.getByChannelId, {
    channelId: message.channel_id,
  });

  if (!ticket || ticket.status === "closed") return;

  // Get server settings to check if user is staff
  const settings = await convex.query(api.serverSettings.getByGuildId, {
    guildId: message.guild_id,
  });

  const isStaff =
    settings?.staffRoleIds.some((roleId) =>
      message.member?.roles.includes(roleId)
    ) ?? false;

  // Record the message
  await convex.mutation(api.ticketMessages.recordSend, {
    ticketId: ticket._id,
    messageId: message.id,
    authorId: message.author.id,
    authorUsername: message.author.username,
    authorDisplayName: message.author.global_name ?? undefined,
    authorAvatarHash: message.author.avatar ?? undefined,
    content: message.content,
    attachments: message.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
      contentType: a.content_type,
      size: a.size,
    })),
    isSystemMessage: false,
  });

  // Update participant stats
  await convex.mutation(api.ticketParticipants.upsertOnMessage, {
    ticketId: ticket._id,
    userId: message.author.id,
    username: message.author.username,
    displayName: message.author.global_name ?? undefined,
    avatarHash: message.author.avatar ?? undefined,
    isStaff,
  });
}
