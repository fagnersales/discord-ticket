"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // In a real implementation, you'd fetch servers from Discord API via user's OAuth
  // For now, we'll show a placeholder instructing users to use the bot commands

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Select a Server</h2>
        <p className="text-muted-foreground">
          Choose a server to manage its ticket settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            To manage a server, first set it up using the bot commands in Discord
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-semibold">Setup Steps:</h4>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>
                Invite the bot to your server with the required permissions
              </li>
              <li>
                Run <code className="rounded bg-background px-1 py-0.5">/settings setup</code> to initialize the bot
              </li>
              <li>
                Create ticket options with <code className="rounded bg-background px-1 py-0.5">/settings option</code>
              </li>
              <li>
                Create a panel with <code className="rounded bg-background px-1 py-0.5">/panel create</code>
              </li>
              <li>Come back here to manage tickets and view transcripts</li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            After setting up a server, enter its ID below to access the dashboard:
          </p>
          <ServerIdInput />
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
