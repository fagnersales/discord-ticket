import type { GatewayChannelDeleteDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleChannelDelete(data: GatewayChannelDeleteDispatchData) {
  // Check if this was a ticket channel
  if (!("guild_id" in data) || !data.guild_id) return;

  try {
    // Mark the ticket as closed if it exists
    await convex.mutation(api.tickets.markClosedByChannelDeletion, {
      channelId: data.id,
    });
  } catch (error) {
    // Ignore errors - the ticket might not exist
    console.error("Error handling channel delete:", error);
  }
}
