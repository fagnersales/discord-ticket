"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  TrendingUp,
  Users,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function GuildOverviewPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const settings = useQuery(api.serverSettings.getByGuildId, { guildId });
  const tickets = useQuery(api.tickets.listByGuild, { guildId, limit: 100 });

  if (settings === undefined || tickets === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Settings className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Server Not Configured</h2>
        <p className="mt-2 max-w-sm text-center text-muted-foreground">
          Complete the initial setup to start using the ticket system on this server.
        </p>
        <Button asChild className="mt-6">
          <Link href={`/dashboard/${guildId}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Configure Server
          </Link>
        </Button>
      </div>
    );
  }

  const openTickets = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");
  const urgentTickets = openTickets.filter(
    (t) => t.priority === "urgent" || t.priority === "high"
  );

  // Calculate resolution rate
  const resolutionRate = tickets.length > 0
    ? Math.round((closedTickets.length / tickets.length) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your ticket system performance
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/${guildId}/tickets`}>
            View All Tickets
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Open Tickets"
          value={openTickets.length}
          description="Awaiting response"
          icon={<Ticket className="h-5 w-5" />}
          trend={openTickets.length > 0 ? "warning" : "success"}
        />
        <StatsCard
          title="Closed Tickets"
          value={closedTickets.length}
          description="Resolved tickets"
          icon={<CheckCircle className="h-5 w-5" />}
          trend="success"
        />
        <StatsCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          description="Tickets resolved"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={resolutionRate >= 70 ? "success" : resolutionRate >= 40 ? "warning" : "destructive"}
        />
        <StatsCard
          title="High Priority"
          value={urgentTickets.length}
          description="Needs attention"
          icon={<AlertCircle className="h-5 w-5" />}
          trend={urgentTickets.length > 0 ? "destructive" : "success"}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Recent tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest ticket updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/${guildId}/tickets`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Ticket className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No tickets yet. Activity will appear here once tickets are created.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 6).map((ticket) => (
                  <Link
                    key={ticket._id}
                    href={`/dashboard/${guildId}/tickets/${ticket._id}`}
                    className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/30 hover:bg-accent/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg group-hover:bg-primary/10">
                      {ticket.status === "open" ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-success" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          #{ticket.ticketNumber.toString().padStart(4, "0")}
                        </span>
                        <span className="text-muted-foreground">by</span>
                        <span className="truncate text-sm">
                          {ticket.creatorUsername}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(ticket.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats sidebar */}
        <div className="space-y-6">
          {/* Server configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                Configuration
              </CardTitle>
              <CardDescription>Current server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigItem
                label="Max tickets per user"
                value={settings.maxOpenTicketsPerUser.toString()}
              />
              <ConfigItem
                label="Staff roles"
                value={`${settings.staffRoleIds.length} role(s)`}
              />
              <ConfigItem
                label="Admin roles"
                value={`${settings.adminRoleIds.length} role(s)`}
              />
              <ConfigItem
                label="Blacklisted users"
                value={`${settings.blacklistedUserIds.length} user(s)`}
              />
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href={`/dashboard/${guildId}/settings`}>
                  Manage Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigItem
                label="Total tickets created"
                value={settings.ticketCounter.toString()}
              />
              <ConfigItem
                label="Cooldown time"
                value={settings.ticketCooldownSeconds > 0 ? `${settings.ticketCooldownSeconds}s` : "None"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend: "success" | "warning" | "destructive";
}) {
  const trendColors = {
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${trendColors[trend]}`}>
            {icon}
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-semibold">{value}</span>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "open" | "closed" }) {
  return (
    <Badge variant={status === "open" ? "success" : "secondary"} size="sm">
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
    <Badge variant={variants[priority] ?? "default"} size="sm">
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
