"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Users, Shield, Ban, ListChecks, LayoutPanelLeft, ChevronRight, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const settings = useQuery(api.serverSettings.getByGuildId, { guildId });
  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const panels = useQuery(api.ticketPanels.listByGuild, { guildId });

  if (settings === undefined || options === undefined || panels === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Not Configured</CardTitle>
          <CardDescription>
            Run <code className="rounded bg-muted px-1 py-0.5">/settings setup</code> in Discord to
            initialize the bot for this server.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your ticket bot settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Core bot configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Max tickets per user</span>
              <span className="font-medium">{settings.maxOpenTicketsPerUser}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cooldown</span>
              <span className="font-medium">
                {settings.ticketCooldownSeconds > 0
                  ? `${settings.ticketCooldownSeconds}s`
                  : "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ticket category</span>
              <span className="font-medium">
                {settings.ticketCategoryId ? `<#${settings.ticketCategoryId}>` : "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Log channel</span>
              <span className="font-medium">
                {settings.logChannelId ? `<#${settings.logChannelId}>` : "Not set"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Use <code className="rounded bg-muted px-1">/settings setup</code> in Discord to
              modify these settings.
            </p>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles
            </CardTitle>
            <CardDescription>Staff and admin role configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Staff Roles</h4>
              {settings.staffRoleIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staff roles configured</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {settings.staffRoleIds.map((roleId) => (
                    <Badge key={roleId} variant="secondary">
                      Role: {roleId}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Admin Roles</h4>
              {settings.adminRoleIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admin roles configured</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {settings.adminRoleIds.map((roleId) => (
                    <Badge key={roleId} variant="default">
                      Role: {roleId}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Use <code className="rounded bg-muted px-1">/settings staff</code> or{" "}
              <code className="rounded bg-muted px-1">/settings admin</code> to manage roles.
            </p>
          </CardContent>
        </Card>

        {/* Ticket Options */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Ticket Options
              </CardTitle>
              <CardDescription>{options.length} option(s) configured</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/${guildId}/settings/options`}>
                Manage
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ticket options created yet</p>
            ) : (
              <div className="space-y-2">
                {options.slice(0, 5).map((option) => (
                  <div
                    key={option._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.emoji ?? "📋"}</span>
                      <span className="font-medium">{option.name}</span>
                    </div>
                    <Badge variant={option.enabled ? "default" : "secondary"}>
                      {option.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
                {options.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    +{options.length - 5} more options
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panels */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LayoutPanelLeft className="h-5 w-5" />
                Ticket Panels
              </CardTitle>
              <CardDescription>{panels.length} panel(s) active</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/${guildId}/settings/panels`}>
                Manage
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {panels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No panels created yet. Use <code className="rounded bg-muted px-1">/panel create</code>{" "}
                in Discord.
              </p>
            ) : (
              <div className="space-y-2">
                {panels.map((panel) => (
                  <div
                    key={panel._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <span className="font-medium">{panel.embed.title ?? "Untitled Panel"}</span>
                      <p className="text-xs text-muted-foreground">
                        Style: {panel.style} • {panel.optionIds.length} option(s)
                      </p>
                    </div>
                    <Badge variant="outline">
                      Channel: {panel.channelId.slice(-6)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blacklist */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Blacklist
            </CardTitle>
            <CardDescription>
              Users who cannot create tickets ({settings.blacklistedUserIds.length} user(s))
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings.blacklistedUserIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blacklisted users</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {settings.blacklistedUserIds.map((userId) => (
                  <Badge key={userId} variant="destructive">
                    User: {userId}
                  </Badge>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Use <code className="rounded bg-muted px-1">/settings blacklist</code> to manage the
              blacklist in Discord.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
