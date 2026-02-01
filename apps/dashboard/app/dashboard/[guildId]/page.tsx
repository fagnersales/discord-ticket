"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function GuildOverviewPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const settings = useQuery(api.serverSettings.getByGuildId, { guildId });
  const tickets = useQuery(api.tickets.listByGuild, { guildId, limit: 100 });

  if (settings === undefined || tickets === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Not Found</CardTitle>
          <CardDescription>
            This server hasn't been set up yet. Run{" "}
            <code className="rounded bg-muted px-1 py-0.5">/settings setup</code> in Discord first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const openTickets = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");
  const urgentTickets = openTickets.filter((t) => t.priority === "urgent" || t.priority === "high");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Server Overview</h2>
        <p className="text-muted-foreground">
          Quick stats and recent activity for this server
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedTickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentTickets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Latest ticket activity</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet</p>
          ) : (
            <div className="space-y-4">
              {tickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      Ticket #{ticket.ticketNumber.toString().padStart(4, "0")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created by {ticket.creatorUsername}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Server info */}
      <Card>
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
          <CardDescription>Current bot settings for this server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max tickets per user</span>
            <span>{settings.maxOpenTicketsPerUser}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Staff roles</span>
            <span>{settings.staffRoleIds.length} role(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Blacklisted users</span>
            <span>{settings.blacklistedUserIds.length} user(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total tickets created</span>
            <span>{settings.ticketCounter}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: "open" | "closed" }) {
  return (
    <Badge variant={status === "open" ? "default" : "secondary"}>
      {status === "open" ? "Open" : "Closed"}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "warning" | "success"> = {
    low: "secondary",
    normal: "default",
    high: "warning",
    urgent: "destructive",
  };

  return (
    <Badge variant={variants[priority] ?? "default"}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}
