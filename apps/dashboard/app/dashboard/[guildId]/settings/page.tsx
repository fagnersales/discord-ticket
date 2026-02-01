"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Ban, ListChecks, LayoutPanelLeft, ChevronRight, Save, X, Plus } from "lucide-react";
import { ChannelSelect, RoleSelect, MemberSelect } from "@/components/discord";

export default function SettingsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const settings = useQuery(api.serverSettings.getByGuildId, { guildId });
  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const panels = useQuery(api.ticketPanels.listByGuild, { guildId });

  const upsertSettings = useMutation(api.serverSettings.upsert);
  const addToBlacklist = useMutation(api.serverSettings.addToBlacklist);
  const removeFromBlacklist = useMutation(api.serverSettings.removeFromBlacklist);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    maxOpenTicketsPerUser: 3,
    ticketCooldownSeconds: 0,
    ticketCategoryId: undefined as string | undefined,
    logChannelId: undefined as string | undefined,
    staffRoleIds: [] as string[],
    adminRoleIds: [] as string[],
  });

  // Blacklist management
  const [blacklistUserId, setBlacklistUserId] = useState<string | undefined>(undefined);
  const [addingToBlacklist, setAddingToBlacklist] = useState(false);

  // Initialize form with existing settings
  useEffect(() => {
    if (settings) {
      setForm({
        maxOpenTicketsPerUser: settings.maxOpenTicketsPerUser,
        ticketCooldownSeconds: settings.ticketCooldownSeconds,
        ticketCategoryId: settings.ticketCategoryId,
        logChannelId: settings.logChannelId,
        staffRoleIds: settings.staffRoleIds,
        adminRoleIds: settings.adminRoleIds,
      });
    }
  }, [settings]);

  if (settings === undefined || options === undefined || panels === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Initial setup for new servers
  const handleInitialSetup = async () => {
    setSaving(true);
    try {
      await upsertSettings({
        guildId,
        ownerId: "dashboard", // Will be the first user to set up
        maxOpenTicketsPerUser: form.maxOpenTicketsPerUser,
        ticketCooldownSeconds: form.ticketCooldownSeconds,
        ticketCategoryId: form.ticketCategoryId,
        logChannelId: form.logChannelId,
        staffRoleIds: form.staffRoleIds,
        adminRoleIds: form.adminRoleIds,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Initial Setup</h2>
          <p className="text-muted-foreground">Configure your ticket bot for this server</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Required configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ticket Category *</Label>
                <ChannelSelect
                  guildId={guildId}
                  mode="single"
                  channelTypes={["category"]}
                  value={form.ticketCategoryId}
                  onValueChange={(value) => setForm({ ...form, ticketCategoryId: value })}
                  placeholder="Select category for tickets..."
                />
                <p className="text-xs text-muted-foreground">
                  Where ticket channels will be created
                </p>
              </div>
              <div className="space-y-2">
                <Label>Log Channel</Label>
                <ChannelSelect
                  guildId={guildId}
                  mode="single"
                  channelTypes={["text"]}
                  value={form.logChannelId}
                  onValueChange={(value) => setForm({ ...form, logChannelId: value })}
                  placeholder="Select log channel..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTickets">Max tickets per user</Label>
                <Input
                  id="maxTickets"
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxOpenTicketsPerUser}
                  onChange={(e) => setForm({ ...form, maxOpenTicketsPerUser: parseInt(e.target.value) || 1 })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Staff Roles
              </CardTitle>
              <CardDescription>Who can manage tickets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Staff Roles *</Label>
                <RoleSelect
                  guildId={guildId}
                  mode="multi"
                  values={form.staffRoleIds}
                  onValuesChange={(values) => setForm({ ...form, staffRoleIds: values })}
                  placeholder="Select staff roles..."
                />
                <p className="text-xs text-muted-foreground">
                  Roles that can view and respond to tickets
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Admin Roles</Label>
                <RoleSelect
                  guildId={guildId}
                  mode="multi"
                  values={form.adminRoleIds}
                  onValuesChange={(values) => setForm({ ...form, adminRoleIds: values })}
                  placeholder="Select admin roles..."
                />
                <p className="text-xs text-muted-foreground">
                  Roles with full management permissions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleInitialSetup}
            disabled={saving || !form.ticketCategoryId || form.staffRoleIds.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Setting up..." : "Complete Setup"}
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertSettings({
        guildId,
        ownerId: settings.ownerId,
        maxOpenTicketsPerUser: form.maxOpenTicketsPerUser,
        ticketCooldownSeconds: form.ticketCooldownSeconds,
        ticketCategoryId: form.ticketCategoryId,
        logChannelId: form.logChannelId,
        staffRoleIds: form.staffRoleIds,
        adminRoleIds: form.adminRoleIds,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddToBlacklist = async () => {
    if (!blacklistUserId) return;
    setAddingToBlacklist(true);
    try {
      await addToBlacklist({ guildId, userId: blacklistUserId });
      setBlacklistUserId(undefined);
    } finally {
      setAddingToBlacklist(false);
    }
  };

  const handleRemoveFromBlacklist = async (userId: string) => {
    await removeFromBlacklist({ guildId, userId });
  };

  const hasChanges =
    form.maxOpenTicketsPerUser !== settings.maxOpenTicketsPerUser ||
    form.ticketCooldownSeconds !== settings.ticketCooldownSeconds ||
    form.ticketCategoryId !== settings.ticketCategoryId ||
    form.logChannelId !== settings.logChannelId ||
    JSON.stringify(form.staffRoleIds.sort()) !== JSON.stringify(settings.staffRoleIds.sort()) ||
    JSON.stringify(form.adminRoleIds.sort()) !== JSON.stringify(settings.adminRoleIds.sort());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Configure your ticket bot settings</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
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
            <div className="space-y-2">
              <Label htmlFor="maxTickets">Max tickets per user</Label>
              <Input
                id="maxTickets"
                type="number"
                min={1}
                max={10}
                value={form.maxOpenTicketsPerUser}
                onChange={(e) => setForm({ ...form, maxOpenTicketsPerUser: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of open tickets a user can have at once (1-10)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cooldown">Cooldown (seconds)</Label>
              <Input
                id="cooldown"
                type="number"
                min={0}
                value={form.ticketCooldownSeconds}
                onChange={(e) => setForm({ ...form, ticketCooldownSeconds: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Time between creating tickets (0 = no cooldown)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Ticket category</Label>
              <ChannelSelect
                guildId={guildId}
                mode="single"
                channelTypes={["category"]}
                value={form.ticketCategoryId}
                onValueChange={(value) => setForm({ ...form, ticketCategoryId: value })}
                placeholder="Select ticket category..."
              />
              <p className="text-xs text-muted-foreground">
                Where ticket channels are created
              </p>
            </div>
            <div className="space-y-2">
              <Label>Log channel</Label>
              <ChannelSelect
                guildId={guildId}
                mode="single"
                channelTypes={["text"]}
                value={form.logChannelId}
                onValueChange={(value) => setForm({ ...form, logChannelId: value })}
                placeholder="Select log channel..."
              />
              <p className="text-xs text-muted-foreground">
                Where ticket logs are sent
              </p>
            </div>
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
            <div className="space-y-2">
              <Label>Staff Roles</Label>
              <RoleSelect
                guildId={guildId}
                mode="multi"
                values={form.staffRoleIds}
                onValuesChange={(values) => setForm({ ...form, staffRoleIds: values })}
                placeholder="Select staff roles..."
              />
              <p className="text-xs text-muted-foreground">
                Roles that can view and respond to tickets
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Admin Roles</Label>
              <RoleSelect
                guildId={guildId}
                mode="multi"
                values={form.adminRoleIds}
                onValuesChange={(values) => setForm({ ...form, adminRoleIds: values })}
                placeholder="Select admin roles..."
              />
              <p className="text-xs text-muted-foreground">
                Roles with full ticket management permissions
              </p>
            </div>
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
              <p className="text-sm text-muted-foreground">No panels created yet</p>
            ) : (
              <div className="space-y-2">
                {panels.map((panel) => (
                  <div
                    key={panel._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <span className="font-medium">{panel.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {panel.style} • {panel.optionIds.length} option(s)
                      </p>
                    </div>
                    <Badge variant="outline">{panel.style}</Badge>
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
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <MemberSelect
                  guildId={guildId}
                  mode="single"
                  value={blacklistUserId}
                  onValueChange={setBlacklistUserId}
                  placeholder="Select member to blacklist..."
                />
              </div>
              <Button
                onClick={handleAddToBlacklist}
                disabled={!blacklistUserId || addingToBlacklist}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {settings.blacklistedUserIds.length > 0 && (
              <>
                <Separator />
                <BlacklistedMembers
                  guildId={guildId}
                  userIds={settings.blacklistedUserIds}
                  onRemove={handleRemoveFromBlacklist}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Separate component to display blacklisted members with remove buttons
function BlacklistedMembers({
  guildId,
  userIds,
  onRemove,
}: {
  guildId: string;
  userIds: string[];
  onRemove: (userId: string) => void;
}) {
  const members = useQuery(api.discord.listMembers, { guildId });

  if (members === undefined) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {userIds.map((userId) => {
        const member = members.find((m) => m.userId === userId);
        const displayName = member?.displayName || member?.username || "Unknown user";

        return (
          <Badge key={userId} variant="secondary" className="gap-1 pr-1">
            {member?.avatarHash ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${userId}/${member.avatarHash}.png?size=32`}
                alt=""
                className="h-4 w-4 rounded-full"
              />
            ) : null}
            {displayName}
            <button
              type="button"
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={() => onRemove(userId)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}
