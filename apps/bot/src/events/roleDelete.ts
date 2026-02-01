import type { GatewayGuildRoleDeleteDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";

export async function handleRoleDelete(data: GatewayGuildRoleDeleteDispatchData) {
  await convex.mutation(api.discord.deleteRole, {
    guildId: data.guild_id,
    roleId: data.role_id,
  });
}
