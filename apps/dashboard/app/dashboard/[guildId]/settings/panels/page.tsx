"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutPanelLeft, Edit, Trash2, Hash, Plus } from "lucide-react";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export default function PanelsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const panels = useQuery(api.ticketPanels.listByGuild, { guildId });
  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const channels = useQuery(api.discord.listChannels, { guildId });
  const removePanel = useMutation(api.ticketPanels.remove);

  if (panels === undefined || options === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const handleDelete = async (id: Id<"ticketPanels">) => {
    if (confirm("Are you sure you want to delete this panel? The message in Discord will remain but won't work.")) {
      await removePanel({ id });
    }
  };

  const getChannelName = (channelId: string) => {
    const channel = channels?.find((c) => c.channelId === channelId);
    return channel?.name ?? "Unknown channel";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ticket Panels</h2>
          <p className="text-muted-foreground">Manage ticket panel messages</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${guildId}/settings/panels/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Panel
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutPanelLeft className="h-5 w-5" />
            Panels ({panels.length})
          </CardTitle>
          <CardDescription>
            Panels let users create tickets by clicking buttons or selecting from a dropdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {panels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LayoutPanelLeft className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No panels created yet</p>
              <Button variant="outline" className="mt-2" asChild>
                <Link href={`/dashboard/${guildId}/settings/panels/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first panel
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {panels.map((panel) => {
                const panelOptions = options.filter((o) => panel.optionIds.includes(o._id));

                return (
                  <div
                    key={panel._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {panel.embed.title ?? "Untitled Panel"}
                        </span>
                        <Badge variant="outline">{panel.style}</Badge>
                      </div>
                      {panel.embed.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {panel.embed.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span>{getChannelName(panel.channelId)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {panelOptions.map((opt) => (
                          <Badge key={opt._id} variant="secondary" className="text-xs">
                            {opt.emoji} {opt.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/${guildId}/settings/panels/${panel._id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(panel._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posting & Refreshing Panels</CardTitle>
          <CardDescription>
            After creating or editing a panel here, use these Discord commands:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <code className="rounded bg-muted px-1">/panel post</code> - Post a new panel message to Discord
          </p>
          <p className="text-sm">
            <code className="rounded bg-muted px-1">/panel refresh</code> - Update buttons/dropdown on an existing panel message
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
