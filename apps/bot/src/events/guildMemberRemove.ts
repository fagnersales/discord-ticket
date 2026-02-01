import type { GatewayGuildMemberRemoveDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleGuildMemberRemove(data: GatewayGuildMemberRemoveDispatchData) {
  await convex.mutation(api.discord.deleteMember, {
    guildId: data.guild_id,
    userId: data.user.id,
  });
}
