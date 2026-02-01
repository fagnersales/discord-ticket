"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Ticket, Search, ExternalLink } from "lucide-react";
import type { Doc } from "convex/_generated/dataModel";

export default function TicketsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const tickets = useQuery(api.tickets.listByGuild, { guildId });
  const options = useQuery(api.ticketOptions.listByGuild, { guildId });

  if (tickets === undefined || options === undefined) {
    return <div className="animate-pulse">Loading...</div>;
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

  // Group by status for tabs
  const openTickets = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
          <p className="text-muted-foreground">
            View and manage all tickets for this server
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or ticket #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
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

          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
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

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredTickets.length} ticket(s)
          </div>
        </CardContent>
      </Card>

      {/* Ticket list */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TicketList tickets={filteredTickets} guildId={guildId} options={options} />
        </TabsContent>
        <TabsContent value="open" className="space-y-4">
          <TicketList
            tickets={filteredTickets.filter((t) => t.status === "open")}
            guildId={guildId}
            options={options}
          />
        </TabsContent>
        <TabsContent value="closed" className="space-y-4">
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
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Ticket className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No tickets found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const option = options.find((o) => o._id === ticket.optionId);

        return (
          <Card key={ticket._id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                  {option?.emoji ?? "📋"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      #{ticket.ticketNumber.toString().padStart(4, "0")}
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-sm text-muted-foreground">
                      {option?.name ?? "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created by {ticket.creatorUsername} •{" "}
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/${guildId}/tickets/${ticket._id}`}>
                    View
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
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
    low: "success",
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
