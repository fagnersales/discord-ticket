import type { GatewayGuildCreateDispatchData } from "@discordjs/core";
import { syncGuildSnapshot } from "../lib/sync";

export async function handleGuildCreate(data: GatewayGuildCreateDispatchData) {
  await syncGuildSnapshot(data.id);
}
