import type { GatewayChannelDeleteDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleChannelDelete(data: GatewayChannelDeleteDispatchData) {
  if (!("guild_id" in data) || !data.guild_id) return;

  // Delete from synced Discord channels
  try {
    await convex.mutation(api.discord.deleteChannel, {
      guildId: data.guild_id,
      channelId: data.id,
    });
  } catch (error) {
    console.error("Error deleting synced channel:", error);
  }

  // Mark the ticket as closed if it exists
  try {
    await convex.mutation(api.tickets.markClosedByChannelDeletion, {
      channelId: data.id,
    });
  } catch (error) {
    // Ignore errors - the ticket might not exist
  }
}
