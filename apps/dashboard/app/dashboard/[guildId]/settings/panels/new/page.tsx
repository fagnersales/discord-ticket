"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ChannelSelect } from "@/components/discord";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export default function NewPanelPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const options = useQuery(api.ticketOptions.listEnabledByGuild, { guildId });
  const createPanel = useMutation(api.ticketPanels.create);

  const [form, setForm] = useState({
    channelId: undefined as string | undefined,
    title: "Support Tickets",
    description: "Click a button below to create a ticket.",
    color: "5865F2",
    style: "buttons" as "buttons" | "dropdown",
    dropdownPlaceholder: "Select a ticket type...",
    selectedOptionIds: [] as Id<"ticketOptions">[],
  });

  const [saving, setSaving] = useState(false);

  if (options === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  const handleCreate = async () => {
    if (!form.channelId || form.selectedOptionIds.length === 0) return;

    setSaving(true);
    try {
      await createPanel({
        guildId,
        channelId: form.channelId,
        embed: {
          title: form.title || undefined,
          description: form.description || undefined,
          color: form.color ? parseInt(form.color, 16) : undefined,
        },
        style: form.style,
        optionIds: form.selectedOptionIds,
        dropdownPlaceholder: form.style === "dropdown" ? form.dropdownPlaceholder || undefined : undefined,
      });
      router.push(`/dashboard/${guildId}/settings/panels`);
    } finally {
      setSaving(false);
    }
  };

  const toggleOption = (optionId: Id<"ticketOptions">) => {
    const isSelected = form.selectedOptionIds.includes(optionId);
    setForm({
      ...form,
      selectedOptionIds: isSelected
        ? form.selectedOptionIds.filter((id) => id !== optionId)
        : [...form.selectedOptionIds, optionId],
    });
  };

  const isValid = form.channelId && form.selectedOptionIds.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/${guildId}/settings/panels`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Panel</h2>
          <p className="text-muted-foreground">Create a ticket panel message</p>
        </div>
      </div>

      {options.length === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              No Ticket Options
            </CardTitle>
            <CardDescription>
              You need to create at least one enabled ticket option before creating a panel.{" "}
              <Link href={`/dashboard/${guildId}/settings/options/new`} className="underline">
                Create an option
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Channel & Style */}
        <Card>
          <CardHeader>
            <CardTitle>Panel Settings</CardTitle>
            <CardDescription>Where and how the panel is displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Channel *</Label>
              <ChannelSelect
                guildId={guildId}
                mode="single"
                channelTypes={["text"]}
                value={form.channelId}
                onValueChange={(value) => setForm({ ...form, channelId: value })}
                placeholder="Select channel to post panel..."
              />
              <p className="text-xs text-muted-foreground">
                The panel message will be posted to this channel
              </p>
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.style === "buttons"}
                    onChange={() => setForm({ ...form, style: "buttons" })}
                  />
                  <span className="text-sm">Buttons</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.style === "dropdown"}
                    onChange={() => setForm({ ...form, style: "dropdown" })}
                  />
                  <span className="text-sm">Dropdown</span>
                </label>
              </div>
            </div>
            {form.style === "dropdown" && (
              <div className="space-y-2">
                <Label htmlFor="placeholder">Dropdown Placeholder</Label>
                <Input
                  id="placeholder"
                  value={form.dropdownPlaceholder}
                  onChange={(e) => setForm({ ...form, dropdownPlaceholder: e.target.value })}
                  placeholder="Select a ticket type..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Embed Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Embed Settings</CardTitle>
            <CardDescription>Customize the panel message appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Support Tickets"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Click a button below to create a ticket..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Embed Color (hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value.replace("#", "") })}
                  placeholder="5865F2"
                  maxLength={6}
                />
                {form.color && (
                  <div
                    className="h-10 w-10 rounded border"
                    style={{ backgroundColor: `#${form.color}` }}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </CardTitle>
            <CardDescription>Approximate appearance in Discord</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-lg border-l-4 bg-[#2b2d31] p-4"
              style={{ borderColor: form.color ? `#${form.color}` : "#5865f2" }}
            >
              {form.title && (
                <h3 className="font-semibold text-white">{form.title}</h3>
              )}
              {form.description && (
                <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
                  {form.description}
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {form.style === "buttons" ? (
                form.selectedOptionIds.length > 0 ? (
                  form.selectedOptionIds.map((optionId) => {
                    const opt = options.find((o) => o._id === optionId);
                    return opt ? (
                      <div
                        key={optionId}
                        className="inline-flex items-center gap-1 rounded bg-[#5865f2] px-3 py-1.5 text-sm text-white"
                      >
                        {opt.emoji} {opt.name}
                      </div>
                    ) : null;
                  })
                ) : (
                  <span className="text-sm text-gray-500">Select options below</span>
                )
              ) : (
                <div className="w-full rounded bg-[#1e1f22] px-3 py-2 text-sm text-gray-400">
                  {form.dropdownPlaceholder || "Select a ticket type..."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Options Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Options *</CardTitle>
            <CardDescription>
              Select which ticket options appear on this panel ({form.selectedOptionIds.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No enabled ticket options available.{" "}
                <Link href={`/dashboard/${guildId}/settings/options/new`} className="underline">
                  Create one first
                </Link>
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {options.map((option) => {
                  const isSelected = form.selectedOptionIds.includes(option._id);
                  return (
                    <label
                      key={option._id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOption(option._id)}
                        className="rounded border-input"
                      />
                      <span className="text-lg">{option.emoji ?? "📋"}</span>
                      <div>
                        <span className="font-medium">{option.name}</span>
                        {option.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Note about Panel Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            After creating this panel, you'll need to use the{" "}
            <code className="rounded bg-muted px-1">/panel post</code> command in Discord to actually
            send the message. The panel configuration will be saved and ready to post.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${guildId}/settings/panels`}>Cancel</Link>
        </Button>
        <Button onClick={handleCreate} disabled={saving || !isValid}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Creating..." : "Create Panel"}
        </Button>
      </div>
    </div>
  );
}
