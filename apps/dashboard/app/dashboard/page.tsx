"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, ArrowRight, AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${ext}?size=64`;
}

export default function DashboardPage() {
  const [userGuilds, setUserGuilds] = useState<UserGuild[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const botServers = useQuery(api.discord.listServers, {});

  const fetchUserGuilds = async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
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
              name: botServer.name, // Use bot's synced name (more up-to-date)
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Select a Server</h2>
        <p className="text-muted-foreground">
          Choose a server to manage its ticket settings
        </p>
      </div>

      {/* Server List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Your Servers
              </CardTitle>
              <CardDescription>
                Servers where you're an admin and the bot is installed
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserGuilds}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading || botServers === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading servers...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-destructive font-medium">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure you've signed in with Discord and granted the necessary permissions.
              </p>
              <Button variant="outline" className="mt-4" onClick={fetchUserGuilds}>
                Try Again
              </Button>
            </div>
          ) : matchedServers && matchedServers.length > 0 ? (
            <div className="grid gap-3">
              {matchedServers.map((server) => (
                <Link
                  key={server.id}
                  href={`/dashboard/${server.id}`}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  {server.icon ? (
                    <img
                      src={getGuildIconUrl(server.id, server.icon)!}
                      alt=""
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Server className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{server.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {server.owner ? "Owner" : "Administrator"}
                      {server.memberCount && ` • ${server.memberCount.toLocaleString()} members`}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Server className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No servers found where you're an admin and the bot is installed.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Invite the bot to a server where you have admin permissions, then refresh.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Fallback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enter Server ID Manually</CardTitle>
          <CardDescription>
            If your server isn't showing up, you can enter the ID directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServerIdInput />
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting Started</CardTitle>
          <CardDescription>
            New to the bot? Follow these steps to set up a server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Invite the bot to your server with the required permissions</li>
            <li>
              Run <code className="rounded bg-muted px-1 py-0.5">/settings setup</code> to
              initialize the bot
            </li>
            <li>
              Create ticket options with{" "}
              <code className="rounded bg-muted px-1 py-0.5">/settings option</code>
            </li>
            <li>
              Create a panel with{" "}
              <code className="rounded bg-muted px-1 py-0.5">/panel create</code>
            </li>
            <li>Come back here to manage tickets and view transcripts</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function ServerIdInput() {
  return (
    <form
      className="flex gap-2"
      action={(formData) => {
        const guildId = formData.get("guildId") as string;
        if (guildId) {
          window.location.href = `/dashboard/${guildId}`;
        }
      }}
    >
      <input
        name="guildId"
        placeholder="Enter Server ID"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit">
        Go
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
