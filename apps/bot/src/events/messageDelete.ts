import type { GatewayMessageDeleteDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleMessageDelete(data: GatewayMessageDeleteDispatchData) {
  // Ignore DMs
  if (!data.guild_id) return;

  // Check if this is a ticket channel
  const ticket = await convex.query(api.tickets.getByChannelId, {
    channelId: data.channel_id,
  });

  if (!ticket || ticket.status === "closed") return;

  // Check if we have an existing action for this message
  const lastAction = await convex.query(api.ticketMessages.getLastActionForMessage, {
    ticketId: ticket._id,
    messageId: data.id,
  });

  // Only record delete if we have the original message
  if (!lastAction) return;

  // Record the deletion
  await convex.mutation(api.ticketMessages.recordDelete, {
    ticketId: ticket._id,
    messageId: data.id,
    authorId: lastAction.authorId,
    authorUsername: lastAction.authorUsername,
  });
}
