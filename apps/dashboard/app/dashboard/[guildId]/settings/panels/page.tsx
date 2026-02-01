"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutPanelLeft,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  Terminal,
  Palette,
} from "lucide-react";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

function discordColorToHex(color: number | string | undefined): string {
  if (!color) return "#8b5cf6"; // Default purple
  if (typeof color === "string") return color;
  return `#${color.toString(16).padStart(6, "0")}`;
}

export default function PanelsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const panels = useQuery(api.ticketPanels.listByGuild, { guildId });
  const panelMessages = useQuery(api.ticketPanels.listMessagesByGuild, { guildId });
  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const removePanel = useMutation(api.ticketPanels.remove);

  if (panels === undefined || options === undefined || panelMessages === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const handleDelete = async (id: Id<"ticketPanels">) => {
    if (confirm("Are you sure you want to delete this panel? All posted messages will stop working.")) {
      await removePanel({ id });
    }
  };

  const getMessageCount = (panelId: Id<"ticketPanels">) => {
    return panelMessages.filter((pm) => pm.panelId === panelId).length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ticket Panels</h1>
          <p className="mt-1 text-muted-foreground">
            Configure panels users interact with to create tickets
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${guildId}/settings/panels/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Panel
          </Link>
        </Button>
      </div>

      {/* Panels list */}
      {panels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <LayoutPanelLeft className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No panels created yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a panel to let users create tickets
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/dashboard/${guildId}/settings/panels/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Panel
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {panels.map((panel, index) => {
            const panelOptions = options.filter((o) => panel.optionIds.includes(o._id));
            const messageCount = getMessageCount(panel._id);

            return (
              <Card
                key={panel._id}
                className="overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-stretch">
                  {/* Color indicator */}
                  <div
                    className="w-1"
                    style={{ backgroundColor: discordColorToHex(panel.embed.color) }}
                  />

                  <div className="flex flex-1 items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <Palette
                          className="h-5 w-5"
                          style={{ color: discordColorToHex(panel.embed.color) }}
                        />
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{panel.name}</span>
                          <Badge variant="outline" size="sm">
                            {panel.style === "buttons" ? "Buttons" : "Dropdown"}
                          </Badge>
                          <Badge variant="secondary" size="sm" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {messageCount} posted
                          </Badge>
                        </div>
                        {panel.embed.title && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {panel.embed.title}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {panelOptions.map((opt) => (
                            <Badge key={opt._id} variant="secondary" size="sm">
                              {opt.emoji} {opt.name}
                            </Badge>
                          ))}
                          {panelOptions.length === 0 && (
                            <span className="text-xs text-muted-foreground">No options selected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon-sm" asChild>
                        <Link href={`/dashboard/${guildId}/settings/panels/${panel._id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleDelete(panel._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            Discord Commands
          </CardTitle>
          <CardDescription>
            Use these commands in Discord to post panels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <code className="text-sm font-medium text-primary">/panel post</code>
            <span className="text-sm text-muted-foreground">Post a panel to a channel</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <code className="text-sm font-medium text-primary">/panel refresh</code>
            <span className="text-sm text-muted-foreground">Update all posted panel messages</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            When you edit a panel, use /panel refresh to update existing messages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
