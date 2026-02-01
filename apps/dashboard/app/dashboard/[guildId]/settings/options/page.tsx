"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Plus, Edit, Trash2, GripVertical, MessageSquare } from "lucide-react";
import type { Doc, Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export default function TicketOptionsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const removeOption = useMutation(api.ticketOptions.remove);
  const updateOption = useMutation(api.ticketOptions.update);

  if (options === undefined) {
    return <div className="animate-pulse">Loading...</div>;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ticket Options</h2>
          <p className="text-muted-foreground">
            Manage ticket categories and their configuration
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Options ({options.length})
          </CardTitle>
          <CardDescription>
            Create options using <code className="rounded bg-muted px-1">/settings option</code> in
            Discord, then customize them here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {options.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ListChecks className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No ticket options yet</p>
              <p className="text-sm text-muted-foreground">
                Use <code className="rounded bg-muted px-1">/settings option</code> in Discord to
                create one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {options
                .sort((a, b) => a.order - b.order)
                .map((option) => (
                  <div
                    key={option._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                        {option.emoji ?? "📋"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.name}</span>
                          <Badge variant={option.enabled ? "default" : "secondary"}>
                            {option.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          {option.useModal && (
                            <Badge variant="outline">
                              <MessageSquare className="mr-1 h-3 w-3" />
                              Modal
                            </Badge>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Channel: {option.channelNameTemplate} •{" "}
                          {option.responsibleRoleIds.length} role(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(option)}
                      >
                        {option.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/${guildId}/settings/options/${option._id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(option._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
