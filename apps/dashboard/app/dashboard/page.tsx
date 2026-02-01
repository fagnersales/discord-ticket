"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { Server, AlertCircle, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type UserGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
};

function getGuildIconUrl(guildId: string, iconHash: string | null): string | null {
  if (!iconHash) return null;
  const ext = iconHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${ext}?size=128`;
}

export default function DashboardPage() {
  const [userGuilds, setUserGuilds] = useState<UserGuild[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const botServers = useQuery(api.discord.listServers, {});

  useEffect(() => {
    const fetchUserGuilds = async () => {
      try {
        const response = await fetch("/api/discord/guilds");
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch guilds");
        }
        const guilds = await response.json();
        setUserGuilds(guilds);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch guilds");
      } finally {
        setLoading(false);
      }
    };

    fetchUserGuilds();
  }, []);

  // Find servers where user is admin AND bot is present
  const matchedServers =
    userGuilds && botServers
      ? userGuilds
          .map((userGuild) => {
            const botServer = botServers.find((s) => s.guildId === userGuild.id);
            if (!botServer) return null;
            return {
              id: userGuild.id,
              name: botServer.name,
              icon: botServer.iconHash ?? userGuild.icon,
              owner: userGuild.owner,
              memberCount: botServer.memberCount,
            };
          })
          .filter(Boolean) as Array<{
          id: string;
          name: string;
          icon: string | null;
          owner: boolean;
          memberCount?: number;
        }>
      : null;

  if (loading || botServers === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading servers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Make sure you've signed in with Discord and granted the necessary permissions.
        </p>
      </div>
    );
  }

  if (!matchedServers || matchedServers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Server className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-medium">No servers found</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          You need to be an admin of a server where the bot is installed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Select a Server</h2>
        <p className="text-muted-foreground">
          Choose a server to manage its ticket settings
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matchedServers.map((server) => (
          <Link
            key={server.id}
            href={`/dashboard/${server.id}`}
            className="group flex flex-col rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              {server.icon ? (
                <img
                  src={getGuildIconUrl(server.id, server.icon)!}
                  alt=""
                  className="h-14 w-14 rounded-full"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Server className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate group-hover:text-primary transition-colors">
                  {server.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {server.owner ? "Owner" : "Administrator"}
                </p>
              </div>
            </div>
            {server.memberCount && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{server.memberCount.toLocaleString()} members</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
