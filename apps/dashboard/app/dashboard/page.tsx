"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { Server, AlertCircle, Loader2, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="mt-4 text-muted-foreground">Loading your servers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="mt-4 text-lg font-medium">{error}</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Make sure you've signed in with Discord and granted the necessary permissions.
        </p>
      </div>
    );
  }

  if (!matchedServers || matchedServers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <Server className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="mt-4 text-lg font-medium">No servers found</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          You need to be an administrator of a server where the bot is installed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Select a Server</h1>
        <p className="mt-1 text-muted-foreground">
          Choose a server to manage its ticket system
        </p>
      </div>

      {/* Server grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matchedServers.map((server, index) => (
          <Link
            key={server.id}
            href={`/dashboard/${server.id}`}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Card
              variant="interactive"
              className="group p-5"
            >
              <div className="flex items-center gap-4">
                {/* Server icon */}
                {server.icon ? (
                  <img
                    src={getGuildIconUrl(server.id, server.icon)!}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover shadow-sm transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-muted/80">
                    <Server className="h-7 w-7 text-muted-foreground" />
                  </div>
                )}

                {/* Server info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold transition-colors group-hover:text-primary">
                    {server.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {server.owner ? "Owner" : "Administrator"}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
              </div>

              {/* Member count */}
              {server.memberCount && (
                <div className="mt-4 flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{server.memberCount.toLocaleString()} members</span>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
