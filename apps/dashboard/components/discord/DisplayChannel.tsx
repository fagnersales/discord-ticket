"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { Hash, Volume2, FolderOpen } from "lucide-react";

const channelIcons = {
  text: Hash,
  voice: Volume2,
  category: FolderOpen,
};

interface DisplayChannelProps {
  guildId: string;
  channelId: string | undefined | null;
  fallback?: string;
}

export function DisplayChannel({ guildId, channelId, fallback = "Not set" }: DisplayChannelProps) {
  const channels = useQuery(api.discord.listChannels, { guildId });

  if (!channelId) {
    return <span className="text-muted-foreground">{fallback}</span>;
  }

  if (channels === undefined) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  const channel = channels.find((c) => c.channelId === channelId);

  if (!channel) {
    return <span className="text-muted-foreground">Unknown channel</span>;
  }

  const Icon = channelIcons[channel.channelType];

  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{channel.name}</span>
    </span>
  );
}
