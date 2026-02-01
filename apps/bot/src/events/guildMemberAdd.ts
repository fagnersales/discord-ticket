import type { GatewayGuildMemberAddDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { buildMemberPayload } from "../lib/payloads";

export async function handleGuildMemberAdd(data: GatewayGuildMemberAddDispatchData) {
  const payload = buildMemberPayload(data.guild_id, data);
  if (!payload) return;

  await convex.mutation(api.discord.upsertMember, { member: payload });
}
