import type { GatewayGuildMemberUpdateDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleGuildMemberUpdate(data: GatewayGuildMemberUpdateDispatchData) {
  // GuildMemberUpdate has a different shape than APIGuildMember
  // It always has user, but may not have joined_at
  const user = data.user;

  await convex.mutation(api.discord.upsertMember, {
    member: {
      guildId: data.guild_id,
      userId: user.id,
      username: user.username ?? "unknown",
      displayName: data.nick ?? user.global_name ?? undefined,
      avatarHash: user.avatar ?? undefined,
      roles: data.roles ?? [],
      joinedAt: data.joined_at ? Date.parse(data.joined_at) : undefined,
    },
  });
}
