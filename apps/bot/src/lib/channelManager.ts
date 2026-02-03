import {
  ChannelType,
  OverwriteType,
  PermissionFlagsBits,
  Routes,
  type APITextChannel,
  type RESTPostAPIGuildChannelJSONBody,
} from "@discordjs/core";
import { rest } from "../client";

export interface CreateTicketChannelOptions {
  guildId: string;
  name: string;
  categoryId?: string;
  creatorId: string;
  responsibleRoleIds: string[];
  topic?: string;
}

export async function createTicketChannel(
  options: CreateTicketChannelOptions
): Promise<APITextChannel> {
  const { guildId, name, categoryId, creatorId, responsibleRoleIds, topic } = options;

  // Build permission overwrites
  const permissionOverwrites = [
    // Deny @everyone from viewing
    {
      id: guildId,
      type: OverwriteType.Role,
      deny: String(PermissionFlagsBits.ViewChannel),
    },
    // Allow the ticket creator
    {
      id: creatorId,
      type: OverwriteType.Member,
      allow: String(
        PermissionFlagsBits.ViewChannel |
          PermissionFlagsBits.SendMessages |
          PermissionFlagsBits.ReadMessageHistory |
          PermissionFlagsBits.AttachFiles |
          PermissionFlagsBits.EmbedLinks
      ),
    },
    // Allow responsible roles
    ...responsibleRoleIds.map((roleId) => ({
      id: roleId,
      type: OverwriteType.Role,
      allow: String(
        PermissionFlagsBits.ViewChannel |
          PermissionFlagsBits.SendMessages |
          PermissionFlagsBits.ReadMessageHistory |
          PermissionFlagsBits.AttachFiles |
          PermissionFlagsBits.EmbedLinks |
          PermissionFlagsBits.ManageMessages
      ),
    })),
  ];

  const body: RESTPostAPIGuildChannelJSONBody = {
    name,
    type: ChannelType.GuildText,
    topic,
    permission_overwrites: permissionOverwrites,
    ...(categoryId && { parent_id: categoryId }),
  };

  return (await rest.post(Routes.guildChannels(guildId), {
    body,
  })) as APITextChannel;
}

export async function addUserToChannel(
  channelId: string,
  userId: string
): Promise<void> {
  await rest.put(Routes.channelPermission(channelId, userId), {
    body: {
      type: OverwriteType.Member,
      allow: String(
        PermissionFlagsBits.ViewChannel |
          PermissionFlagsBits.SendMessages |
          PermissionFlagsBits.ReadMessageHistory |
          PermissionFlagsBits.AttachFiles |
          PermissionFlagsBits.EmbedLinks
      ),
    },
  });
}

export async function removeUserFromChannel(
  channelId: string,
  userId: string
): Promise<void> {
  await rest.delete(Routes.channelPermission(channelId, userId));
}

export async function renameChannel(
  channelId: string,
  name: string
): Promise<void> {
  await rest.patch(Routes.channel(channelId), {
    body: { name },
  });
}

export async function deleteChannel(channelId: string): Promise<void> {
  await rest.delete(Routes.channel(channelId));
}
