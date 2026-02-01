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
import {
  Settings,
  Shield,
  Ban,
  ListChecks,
  LayoutPanelLeft,
  ChevronRight,
  Save,
  X,
  Plus,
  Loader2,
  Hash,
  Clock,
  Users,
} from "lucide-react";
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

  const [blacklistUserId, setBlacklistUserId] = useState<string | undefined>(undefined);
  const [addingToBlacklist, setAddingToBlacklist] = useState(false);

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
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Initial setup for new servers
  const handleInitialSetup = async () => {
    setSaving(true);
    try {
      await upsertSettings({
        guildId,
        ownerId: "dashboard",
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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center max-w-lg mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Initial Setup</h1>
          <p className="mt-2 text-muted-foreground">
            Configure the ticket bot for this server. You can change these settings later.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-muted-foreground" />
                Channels
              </CardTitle>
              <CardDescription>Where tickets will be managed</CardDescription>
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
                  New ticket channels will be created here
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
                <p className="text-xs text-muted-foreground">
                  Ticket logs and transcripts will be sent here
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
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
                  Can view and respond to tickets
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
                  Full management permissions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Limits
              </CardTitle>
              <CardDescription>Control ticket creation</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
                <p className="text-xs text-muted-foreground">1-10 open tickets at once</p>
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
                <p className="text-xs text-muted-foreground">0 = no cooldown</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleInitialSetup}
            disabled={saving || !form.ticketCategoryId || form.staffRoleIds.length === 0}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure your ticket bot settings
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLinkCard
          href={`/dashboard/${guildId}/settings/options`}
          icon={<ListChecks className="h-6 w-6" />}
          title="Ticket Options"
          description="Configure ticket types and categories"
          badge={`${options.length} option(s)`}
        />
        <QuickLinkCard
          href={`/dashboard/${guildId}/settings/panels`}
          icon={<LayoutPanelLeft className="h-6 w-6" />}
          title="Ticket Panels"
          description="Manage ticket creation panels"
          badge={`${panels.length} panel(s)`}
        />
      </div>

      {/* Settings grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              General Settings
            </CardTitle>
            <CardDescription>Core bot configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  min={0}
                  value={form.ticketCooldownSeconds}
                  onChange={(e) => setForm({ ...form, ticketCooldownSeconds: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Separator />
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
            </div>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Staff Roles
            </CardTitle>
            <CardDescription>Who can manage tickets</CardDescription>
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
                Can view and respond to tickets
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
                Full ticket management permissions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Blacklist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-muted-foreground" />
              Blacklist
            </CardTitle>
            <CardDescription>
              Users who cannot create tickets ({settings.blacklistedUserIds.length})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
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
                {addingToBlacklist ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
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

function QuickLinkCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link href={href}>
      <Card variant="interactive" className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{title}</h3>
              <Badge variant="secondary" size="sm">
                {badge}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}

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
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {userIds.map((userId) => {
        const member = members.find((m) => m.userId === userId);
        const displayName = member?.displayName || member?.username || "Unknown user";

        return (
          <Badge key={userId} variant="secondary" className="gap-2 pr-1 py-1">
            {member?.avatarHash ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${userId}/${member.avatarHash}.png?size=32`}
                alt=""
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                <Users className="h-3 w-3" />
              </div>
            )}
            <span>{displayName}</span>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
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
