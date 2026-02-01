import { Routes, type APIGuildMember, type APIEmoji, type APIChannel, type APIRole, type APIGuild } from "@discordjs/core";
import { rest } from "../client";
import { convex } from "../convex";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import {
  buildChannelPayload,
  buildRolePayload,
  buildMemberPayload,
  buildEmojiPayload,
} from "./payloads";

export async function fetchAllMembers(guildId: string): Promise<APIGuildMember[]> {
  const members: APIGuildMember[] = [];
  let after: string | undefined;

  while (true) {
    const query = new URLSearchParams({ limit: "1000" });
    if (after) query.set("after", after);

    const page = await rest.get(Routes.guildMembers(guildId), { query }) as APIGuildMember[];
    if (page.length === 0) break;

    members.push(...page);
    after = page[page.length - 1]?.user?.id;
    if (!after || page.length < 1000) break;
  }

  return members;
}

export async function syncGuildSnapshot(guildId: string): Promise<void> {
  try {
    console.log(`[sync] Starting snapshot for guild ${guildId}`);

    // 1. Sync server info
    const guild = await rest.get(Routes.guild(guildId)) as APIGuild;
    await convex.mutation(api.discord.upsertServer, {
      server: {
        guildId,
        name: guild.name,
        iconHash: guild.icon ?? undefined,
        ownerId: guild.owner_id ?? undefined,
        memberCount: guild.approximate_member_count ?? undefined,
      },
    });

    // 2. Sync channels (with cleanup of removed)
    const channels = await rest.get(Routes.guildChannels(guildId)) as APIChannel[];
    console.log(`[sync] Syncing ${channels.length} channels`);
    const existingChannels = await convex.query(api.discord.listChannels, { guildId });
    const seenChannelIds = new Set<string>();

    for (const channel of channels) {
      const payload = buildChannelPayload(guildId, channel);
      if (!payload) continue;
      seenChannelIds.add(payload.channelId);
      await convex.mutation(api.discord.upsertChannel, { channel: payload });
    }

    for (const channel of existingChannels) {
      if (!seenChannelIds.has(channel.channelId)) {
        await convex.mutation(api.discord.deleteChannel, { guildId, channelId: channel.channelId });
      }
    }

    // 3. Sync roles (with cleanup of removed)
    const roles = await rest.get(Routes.guildRoles(guildId)) as APIRole[];
    console.log(`[sync] Syncing ${roles.length} roles`);
    const existingRoles = await convex.query(api.discord.listRoles, { guildId });
    const seenRoleIds = new Set<string>();

    for (const role of roles) {
      const payload = buildRolePayload(guildId, role);
      seenRoleIds.add(payload.roleId);
      await convex.mutation(api.discord.upsertRole, { role: payload });
    }

    for (const role of existingRoles) {
      if (!seenRoleIds.has(role.roleId)) {
        await convex.mutation(api.discord.deleteRole, { guildId, roleId: role.roleId });
      }
    }

    // 4. Sync members (with cleanup of removed)
    const members = await fetchAllMembers(guildId);
    console.log(`[sync] Syncing ${members.length} members`);
    const existingMembers = await convex.query(api.discord.listMembers, { guildId });
    const seenMemberIds = new Set<string>();

    for (const member of members) {
      const payload = buildMemberPayload(guildId, member);
      if (!payload) continue;
      seenMemberIds.add(payload.userId);
      await convex.mutation(api.discord.upsertMember, { member: payload });
    }

    for (const member of existingMembers) {
      if (!seenMemberIds.has(member.userId)) {
        await convex.mutation(api.discord.deleteMember, { guildId, userId: member.userId });
      }
    }

    // 5. Sync emojis (with cleanup of removed)
    const emojis = await rest.get(Routes.guildEmojis(guildId)) as APIEmoji[];
    console.log(`[sync] Syncing ${emojis.length} emojis`);
    const existingEmojis = await convex.query(api.discord.listEmojis, { guildId });
    const seenEmojiIds = new Set<string>();

    for (const emoji of emojis) {
      const payload = buildEmojiPayload(guildId, emoji, "guild");
      if (!payload) continue;
      seenEmojiIds.add(payload.emojiId);
      await convex.mutation(api.discord.upsertEmoji, { emoji: payload });
    }

    // Application emojis (optional - may fail)
    try {
      const applicationId = process.env.DISCORD_APPLICATION_ID;
      if (applicationId) {
        const appEmojisResponse = await rest.get(Routes.applicationEmojis(applicationId)) as { items: APIEmoji[] };
        const appEmojis = appEmojisResponse.items ?? [];
        console.log(`[sync] Syncing ${appEmojis.length} application emojis`);

        for (const emoji of appEmojis) {
          const payload = buildEmojiPayload(guildId, emoji, "application");
          if (!payload) continue;
          seenEmojiIds.add(payload.emojiId);
          await convex.mutation(api.discord.upsertEmoji, { emoji: payload });
        }
      }
    } catch {
      // Application emojis may fail if bot doesn't have permission
      console.log("[sync] Application emojis fetch skipped");
    }

    for (const emoji of existingEmojis) {
      if (!seenEmojiIds.has(emoji.emojiId)) {
        await convex.mutation(api.discord.deleteEmoji, { guildId, emojiId: emoji.emojiId });
      }
    }

    console.log(`[sync] Snapshot complete for guild ${guildId}`);
  } catch (error) {
    console.error(`[sync] Snapshot error for guild ${guildId}:`, error);
  }
}

export async function syncGuildEmojis(guildId: string, emojis: APIEmoji[]): Promise<void> {
  try {
    const existingEmojis = await convex.query(api.discord.listEmojisBySource, {
      guildId,
      source: "guild",
    });
    const seenEmojiIds = new Set<string>();

    for (const emoji of emojis) {
      const payload = buildEmojiPayload(guildId, emoji, "guild");
      if (!payload) continue;
      seenEmojiIds.add(payload.emojiId);
      await convex.mutation(api.discord.upsertEmoji, { emoji: payload });
    }

    for (const emoji of existingEmojis) {
      if (!seenEmojiIds.has(emoji.emojiId)) {
        await convex.mutation(api.discord.deleteEmoji, { guildId, emojiId: emoji.emojiId });
      }
    }
  } catch (error) {
    console.error("[sync] Guild emojis sync error:", error);
  }
}
