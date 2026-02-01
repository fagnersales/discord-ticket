import type { APIMessage } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleMessageUpdate(message: APIMessage) {
  // Ignore DMs
  if (!message.guild_id) return;

  // Ignore partial updates (where content is not present)
  if (message.content === undefined) return;

  // Check if this is a ticket channel
  const ticket = await convex.query(api.tickets.getByChannelId, {
    channelId: message.channel_id,
  });

  if (!ticket || ticket.status === "closed") return;

  // Check if we have an existing send action for this message
  const lastAction = await convex.query(api.ticketMessages.getLastActionForMessage, {
    ticketId: ticket._id,
    messageId: message.id,
  });

  // Only record edit if we have the original message
  if (!lastAction) return;

  // Record the edit
  await convex.mutation(api.ticketMessages.recordEdit, {
    ticketId: ticket._id,
    messageId: message.id,
    authorId: message.author.id,
    authorUsername: message.author.username,
    authorDisplayName: message.author.global_name ?? undefined,
    authorAvatarHash: message.author.avatar ?? undefined,
    content: message.content,
    attachments: message.attachments?.map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
      contentType: a.content_type,
      size: a.size,
    })),
  });
}
