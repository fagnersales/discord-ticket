"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  Search,
  ExternalLink,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { Doc } from "@discord-ticket/convex/convex/_generated/dataModel";

export default function TicketsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const tickets = useQuery(api.tickets.listByGuild, { guildId });
  const options = useQuery(api.ticketOptions.listByGuild, { guildId });

  if (tickets === undefined || options === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Filter tickets
  let filteredTickets = tickets;

  if (statusFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => t.status === statusFilter);
  }

  if (priorityFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => t.priority === priorityFilter);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredTickets = filteredTickets.filter(
      (t) =>
        t.creatorUsername.toLowerCase().includes(searchLower) ||
        t.ticketNumber.toString().includes(searchLower)
    );
  }

  // Counts for tabs
  const openTickets = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage all support tickets
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user or ticket number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredTickets.length} ticket(s)
          </div>
        </CardContent>
      </Card>

      {/* Tickets with tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Ticket className="h-4 w-4" />
            All
            <Badge variant="secondary" size="sm">
              {tickets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-2">
            <Clock className="h-4 w-4" />
            Open
            <Badge variant="success" size="sm">
              {openTickets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Closed
            <Badge variant="secondary" size="sm">
              {closedTickets.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TicketList tickets={filteredTickets} guildId={guildId} options={options} />
        </TabsContent>
        <TabsContent value="open">
          <TicketList
            tickets={filteredTickets.filter((t) => t.status === "open")}
            guildId={guildId}
            options={options}
          />
        </TabsContent>
        <TabsContent value="closed">
          <TicketList
            tickets={filteredTickets.filter((t) => t.status === "closed")}
            guildId={guildId}
            options={options}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketList({
  tickets,
  guildId,
  options,
}: {
  tickets: Doc<"tickets">[];
  guildId: string;
  options: Doc<"ticketOptions">[];
}) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Ticket className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">No tickets found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket, index) => {
        const option = options.find((o) => o._id === ticket.optionId);

        return (
          <Link
            key={ticket._id}
            href={`/dashboard/${guildId}/tickets/${ticket._id}`}
            className="block animate-slide-up"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <Card
              variant="interactive"
              className="p-0 overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                {/* Status indicator */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg ${
                    ticket.status === "open"
                      ? "bg-success/10"
                      : "bg-muted"
                  }`}
                >
                  {option?.emoji ?? "📋"}
                </div>

                {/* Ticket info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      #{ticket.ticketNumber.toString().padStart(4, "0")}
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className="truncate text-muted-foreground">
                      {option?.name ?? "Unknown Type"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{ticket.creatorUsername}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>

                {/* Badges and action */}
                <div className="flex items-center gap-3">
                  {ticket.priority === "urgent" || ticket.priority === "high" ? (
                    <div className="flex items-center gap-1.5 text-sm text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="hidden sm:inline">Priority</span>
                    </div>
                  ) : null}
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                  <Button variant="ghost" size="icon-sm" className="hidden sm:flex">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Bottom border color based on status */}
              <div
                className={`h-1 w-full ${
                  ticket.status === "open"
                    ? ticket.priority === "urgent"
                      ? "bg-destructive"
                      : ticket.priority === "high"
                      ? "bg-warning"
                      : "bg-success"
                    : "bg-muted"
                }`}
              />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: "open" | "closed" }) {
  return (
    <Badge variant={status === "open" ? "success" : "secondary"}>
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

  const labels: Record<string, string> = {
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
  };

  return <Badge variant={variants[priority] ?? "default"}>{labels[priority]}</Badge>;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
