"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChannelSelect } from "@/components/discord";
import {
  LayoutPanelLeft,
  Plus,
  MessageSquare,
  Send,
  MoreHorizontal,
  Pencil,
  Trash2,
  Grid3X3,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

function discordColorToHex(color: number | string | undefined): string {
  if (!color) return "#8b5cf6";
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
  const postPanel = useAction(api.panelActions.postPanel);

  const [postingPanelId, setPostingPanelId] = useState<Id<"ticketPanels"> | null>(null);
  const [postChannelId, setPostChannelId] = useState<string | undefined>(undefined);
  const [openPopover, setOpenPopover] = useState<Id<"ticketPanels"> | null>(null);

  const handlePost = async (panelId: Id<"ticketPanels">) => {
    if (!postChannelId) return;
    setPostingPanelId(panelId);
    try {
      await postPanel({ panelId, channelId: postChannelId });
      setOpenPopover(null);
      setPostChannelId(undefined);
    } catch (error) {
      console.error("Failed to post panel:", error);
      alert("Failed to post panel. Make sure the bot has permission to send messages in that channel.");
    } finally {
      setPostingPanelId(null);
    }
  };

  if (panels === undefined || options === undefined || panelMessages === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-10 w-32 rounded-lg bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-muted" />
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

      {/* Panels grid */}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {panels.map((panel, index) => {
            const panelOptions = options.filter((o) => panel.optionIds.includes(o._id));
            const messageCount = getMessageCount(panel._id);
            const accentColor = discordColorToHex(panel.embed.color);

            return (
              <Card
                key={panel._id}
                className="group relative overflow-hidden transition-all hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Accent gradient top */}
                <div
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
                  }}
                />

                <CardContent className="p-5">
                  {/* Header with menu */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold leading-none">{panel.name}</h3>
                      {panel.embed.title && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {panel.embed.title}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/${guildId}/settings/panels/${panel._id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(panel._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>{messageCount} posted</span>
                    </div>
                    <Badge variant="outline" size="sm">
                      {panel.style === "buttons" ? (
                        <>
                          <Grid3X3 className="mr-1 h-3 w-3" />
                          Buttons
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-3 w-3" />
                          Dropdown
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Options preview */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {panelOptions.slice(0, 4).map((opt) => (
                      <span
                        key={opt._id}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        {opt.emoji} {opt.name}
                      </span>
                    ))}
                    {panelOptions.length > 4 && (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        +{panelOptions.length - 4} more
                      </span>
                    )}
                    {panelOptions.length === 0 && (
                      <span className="text-xs text-muted-foreground">No options selected</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2">
                    <Popover
                      open={openPopover === panel._id}
                      onOpenChange={(open) => {
                        setOpenPopover(open ? panel._id : null);
                        if (!open) setPostChannelId(undefined);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="default" size="sm" className="flex-1">
                          <Send className="mr-2 h-4 w-4" />
                          Send
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-72">
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Post panel to channel</p>
                          <ChannelSelect
                            guildId={guildId}
                            mode="single"
                            channelTypes={["text"]}
                            value={postChannelId}
                            onValueChange={setPostChannelId}
                            placeholder="Select channel..."
                          />
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={!postChannelId || postingPanelId === panel._id}
                            onClick={() => handlePost(panel._id)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {postingPanelId === panel._id ? "Posting..." : "Post"}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/${guildId}/settings/panels/${panel._id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
