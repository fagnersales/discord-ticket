"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

function getAvatarUrl(userId: string, avatarHash: string | undefined): string | undefined {
  if (!avatarHash) return undefined;
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=32`;
}

interface DisplayMemberProps {
  guildId: string;
  userId: string;
  variant?: "badge" | "inline";
}

export function DisplayMember({ guildId, userId, variant = "badge" }: DisplayMemberProps) {
  const members = useQuery(api.discord.listMembers, { guildId });

  if (members === undefined) {
    return variant === "badge" ? (
      <Badge variant="secondary">Loading...</Badge>
    ) : (
      <span className="text-muted-foreground">Loading...</span>
    );
  }

  const member = members.find((m) => m.userId === userId);

  if (!member) {
    return variant === "badge" ? (
      <Badge variant="secondary">Unknown user</Badge>
    ) : (
      <span className="text-muted-foreground">Unknown user</span>
    );
  }

  const displayName = member.displayName || member.username;
  const avatarUrl = getAvatarUrl(member.userId, member.avatarHash);

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-1">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-4 w-4 rounded-full" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
        <span>{displayName}</span>
      </span>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-4 w-4 rounded-full" />
      ) : (
        <User className="h-3 w-3" />
      )}
      {displayName}
    </Badge>
  );
}

interface DisplayMembersProps {
  guildId: string;
  userIds: string[];
  emptyText?: string;
  variant?: "badge" | "inline";
}

export function DisplayMembers({ guildId, userIds, emptyText = "None", variant = "badge" }: DisplayMembersProps) {
  const members = useQuery(api.discord.listMembers, { guildId });

  if (userIds.length === 0) {
    return <span className="text-muted-foreground">{emptyText}</span>;
  }

  if (members === undefined) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  const matchedMembers = userIds
    .map((id) => members.find((m) => m.userId === id))
    .filter(Boolean);

  if (matchedMembers.length === 0) {
    return <span className="text-muted-foreground">{userIds.length} unknown user(s)</span>;
  }

  if (variant === "inline") {
    return (
      <span>
        {matchedMembers.map((member, i) => {
          const avatarUrl = getAvatarUrl(member!.userId, member!.avatarHash);
          return (
            <span key={member!.userId}>
              {i > 0 && ", "}
              <span className="inline-flex items-center gap-1">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-4 w-4 rounded-full inline" />
                ) : (
                  <User className="h-3 w-3 text-muted-foreground inline" />
                )}
                {member!.displayName || member!.username}
              </span>
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {matchedMembers.map((member) => {
        const avatarUrl = getAvatarUrl(member!.userId, member!.avatarHash);
        return (
          <Badge key={member!.userId} variant="secondary" className="gap-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-4 w-4 rounded-full" />
            ) : (
              <User className="h-3 w-3" />
            )}
            {member!.displayName || member!.username}
          </Badge>
        );
      })}
    </div>
  );
}
