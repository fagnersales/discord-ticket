import type { GatewayChannelCreateDispatchData } from "@discordjs/core";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { buildChannelPayload } from "../lib/payloads";

export async function handleChannelCreate(data: GatewayChannelCreateDispatchData) {
  if (!("guild_id" in data) || !data.guild_id) return;

  const payload = buildChannelPayload(data.guild_id, data);
  if (!payload) return;

  await convex.mutation(api.discord.upsertChannel, { channel: payload });
}
