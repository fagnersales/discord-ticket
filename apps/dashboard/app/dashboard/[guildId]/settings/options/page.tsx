"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ListChecks,
  Edit,
  Trash2,
  MessageSquare,
  Plus,
  ToggleLeft,
  ToggleRight,
  Hash,
} from "lucide-react";
import { DisplayRoles } from "@/components/discord";
import type { Doc, Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export default function TicketOptionsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const removeOption = useMutation(api.ticketOptions.remove);
  const updateOption = useMutation(api.ticketOptions.update);

  if (options === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted" />
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

      {/* Options list */}
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
        <div className="space-y-3">
          {options
            .sort((a, b) => a.order - b.order)
            .map((option, index) => (
              <Card
                key={option._id}
                className="overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-stretch">
                  {/* Status indicator */}
                  <div
                    className={`w-1 ${option.enabled ? "bg-success" : "bg-muted"}`}
                  />

                  <div className="flex flex-1 items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      {/* Emoji */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                        {option.emoji ?? "📋"}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{option.name}</span>
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
                        {option.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {option.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          <span>{option.channelNameTemplate}</span>
                        </div>
                        {option.responsibleRoleIds.length > 0 && (
                          <div className="pt-1">
                            <DisplayRoles
                              guildId={guildId}
                              roleIds={option.responsibleRoleIds}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(option)}
                        className="gap-2"
                      >
                        {option.enabled ? (
                          <ToggleRight className="h-4 w-4 text-success" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {option.enabled ? "Disable" : "Enable"}
                        </span>
                      </Button>
                      <Button variant="outline" size="icon-sm" asChild>
                        <Link href={`/dashboard/${guildId}/settings/options/${option._id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleDelete(option._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
