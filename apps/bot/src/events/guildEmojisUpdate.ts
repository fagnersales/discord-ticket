import type { GatewayGuildEmojisUpdateDispatchData } from "@discordjs/core";
import { syncGuildEmojis } from "../lib/sync";

export async function handleGuildEmojisUpdate(data: GatewayGuildEmojisUpdateDispatchData) {
  await syncGuildEmojis(data.guild_id, data.emojis);
}
