import { ChannelType, type APIChannel, type APIRole, type APIGuildMember, type APIEmoji } from "@discordjs/core";

export function buildEmojiImageUrl(emojiId: string, animated: boolean): string {
  const extension = animated ? "gif" : "png";
  return `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
}

export function buildChannelPayload(guildId: string, channel: APIChannel) {
  if (!("name" in channel) || !channel.name) return null;

  const base = {
    guildId,
    channelId: channel.id,
    name: channel.name,
    parentId: "parent_id" in channel ? (channel.parent_id ?? undefined) : undefined,
    position: "position" in channel ? (channel.position ?? 0) : 0,
  };

  switch (channel.type) {
    case ChannelType.GuildText:
    case ChannelType.GuildAnnouncement:
      return {
        channelType: "text" as const,
        ...base,
        topic: "topic" in channel ? (channel.topic ?? undefined) : undefined,
        nsfw: "nsfw" in channel ? (channel.nsfw ?? false) : false,
        rateLimitPerUser: "rate_limit_per_user" in channel ? (channel.rate_limit_per_user ?? 0) : 0,
      };
    case ChannelType.GuildVoice:
    case ChannelType.GuildStageVoice:
      return {
        channelType: "voice" as const,
        ...base,
        bitrate: "bitrate" in channel ? (channel.bitrate ?? 64000) : 64000,
        userLimit: "user_limit" in channel ? (channel.user_limit ?? 0) : 0,
        rtcRegion: "rtc_region" in channel ? (channel.rtc_region ?? undefined) : undefined,
      };
    case ChannelType.GuildCategory:
      return {
        channelType: "category" as const,
        ...base,
      };
    default:
      return null;
  }
}

export function buildRolePayload(guildId: string, role: APIRole) {
  return {
    guildId,
    roleId: role.id,
    name: role.name ?? "unknown",
    color: role.color ?? 0,
    hoist: role.hoist ?? false,
    position: role.position ?? 0,
    permissions: role.permissions ?? "0",
    managed: role.managed ?? false,
    mentionable: role.mentionable ?? false,
  };
}

export function buildMemberPayload(guildId: string, member: APIGuildMember) {
  const user = member.user;
  if (!user) return null;

  return {
    guildId,
    userId: user.id,
    username: user.username ?? "unknown",
    displayName: member.nick ?? user.global_name ?? undefined,
    avatarHash: user.avatar ?? undefined,
    roles: member.roles ?? [],
    joinedAt: member.joined_at ? Date.parse(member.joined_at) : undefined,
  };
}

export function buildEmojiPayload(
  guildId: string,
  emoji: APIEmoji,
  source: "guild" | "application",
) {
  if (!emoji.id) return null;

  const animated = emoji.animated ?? false;

  return {
    guildId,
    emojiId: emoji.id,
    name: emoji.name ?? "unknown",
    animated,
    imageUrl: buildEmojiImageUrl(emoji.id, animated),
    source,
  };
}
