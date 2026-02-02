"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ListChecks,
  Trash2,
  MessageSquare,
  Plus,
  ToggleLeft,
  ToggleRight,
  Hash,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import type { Doc, Id } from "@discord-ticket/convex/convex/_generated/dataModel";

function intToHex(color: number): string {
  if (color === 0) return "#99aab5";
  return `#${color.toString(16).padStart(6, "0")}`;
}

interface RolesPreviewProps {
  guildId: string;
  roleIds: string[];
  maxDisplay?: number;
}

function RolesPreview({ guildId, roleIds, maxDisplay = 3 }: RolesPreviewProps) {
  const roles = useQuery(api.discord.listRoles, { guildId });

  if (roleIds.length === 0) {
    return null;
  }

  if (roles === undefined) {
    return <span className="text-xs text-muted-foreground">Loading roles...</span>;
  }

  const matchedRoles = roleIds
    .map((id) => roles.find((r) => r.roleId === id))
    .filter(Boolean);

  if (matchedRoles.length === 0) {
    return null;
  }

  const displayRoles = matchedRoles.slice(0, maxDisplay);
  const remaining = matchedRoles.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayRoles.map((role) => (
        <span
          key={role!.roleId}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: intToHex(role!.color) }}
          />
          {role!.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining} more</span>
      )}
    </div>
  );
}

export default function TicketOptionsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const removeOption = useMutation(api.ticketOptions.remove);
  const updateOption = useMutation(api.ticketOptions.update);

  if (options === undefined) {
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

  const handleDelete = async (id: Id<"ticketOptions">) => {
    if (confirm("Are you sure you want to delete this option?")) {
      await removeOption({ id });
    }
  };

  const handleToggle = async (option: Doc<"ticketOptions">) => {
    await updateOption({ id: option._id, enabled: !option.enabled });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ticket Options</h1>
          <p className="mt-1 text-muted-foreground">
            Define ticket types users can choose from
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${guildId}/settings/options/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Option
          </Link>
        </Button>
      </div>

      {/* Options grid */}
      {options.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <ListChecks className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No ticket options yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create options to let users choose their ticket type
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/dashboard/${guildId}/settings/options/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Option
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {options
            .sort((a, b) => a.order - b.order)
            .map((option, index) => (
              <Card
                key={option._id}
                className="group relative overflow-hidden transition-all hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Accent gradient top */}
                <div
                  className="h-1.5"
                  style={{
                    background: option.enabled
                      ? "linear-gradient(90deg, #22c55e, #22c55e88)"
                      : "linear-gradient(90deg, #6b7280, #6b728088)",
                  }}
                />

                <CardContent className="p-5">
                  {/* Header with menu */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-semibold leading-none truncate">{option.name}</h3>
                      {option.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {option.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/${guildId}/settings/options/${option._id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(option)}>
                          {option.enabled ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(option._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Centered emoji */}
                  <div className="mt-4 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-2xl">
                      {option.emoji ?? "📋"}
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant={option.enabled ? "success" : "secondary"} size="sm">
                      {option.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {option.useModal && (
                      <Badge variant="outline" size="sm">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Modal
                      </Badge>
                    )}
                  </div>

                  {/* Channel template */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span className="truncate">{option.channelNameTemplate}</span>
                  </div>

                  {/* Roles preview */}
                  {option.responsibleRoleIds.length > 0 && (
                    <div className="mt-2">
                      <RolesPreview
                        guildId={guildId}
                        roleIds={option.responsibleRoleIds}
                        maxDisplay={3}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-5 flex gap-2">
                    <Button
                      variant={option.enabled ? "secondary" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggle(option)}
                    >
                      {option.enabled ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/${guildId}/settings/options/${option._id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
