import type { GatewayGuildRoleUpdateDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { buildRolePayload } from "../lib/payloads";

export async function handleRoleUpdate(data: GatewayGuildRoleUpdateDispatchData) {
  const payload = buildRolePayload(data.guild_id, data.role);
  await convex.mutation(api.discord.upsertRole, { role: payload });
}
