"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Eye, Send, Trash2, Hash, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ChannelSelect, DisplayChannel } from "@/components/discord";
import type { Id } from "@discord-ticket/convex/convex/_generated/dataModel";

export default function EditPanelPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;
  const panelId = params.panelId as Id<"ticketPanels">;

  const panel = useQuery(api.ticketPanels.get, { id: panelId });
  const options = useQuery(api.ticketOptions.listEnabledByGuild, { guildId });
  const panelMessages = useQuery(api.ticketPanels.listMessagesByPanel, { panelId });
  const updatePanel = useMutation(api.ticketPanels.update);
  const removeMessage = useMutation(api.ticketPanels.removeMessageById);

  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    color: "",
    style: "buttons" as "buttons" | "dropdown",
    dropdownPlaceholder: "",
    selectedOptionIds: [] as Id<"ticketOptions">[],
  });

  const [saving, setSaving] = useState(false);

  // For posting to channel
  const [postChannelId, setPostChannelId] = useState<string | undefined>(undefined);
  const [posting, setPosting] = useState(false);

  // Action to post panel (we'll create this)
  const postPanel = useAction(api.panelActions.postPanel);

  useEffect(() => {
    if (panel) {
      setForm({
        name: panel.name,
        title: panel.embed.title ?? "",
        description: panel.embed.description ?? "",
        color: panel.embed.color?.toString(16).padStart(6, "0") ?? "",
        style: panel.style,
        dropdownPlaceholder: panel.dropdownPlaceholder ?? "",
        selectedOptionIds: panel.optionIds,
      });
    }
  }, [panel]);

  if (panel === undefined || options === undefined || panelMessages === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!panel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Panel Not Found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePanel({
        id: panelId,
        name: form.name,
        embed: {
          title: form.title || undefined,
          description: form.description || undefined,
          color: form.color ? parseInt(form.color, 16) : undefined,
        },
        style: form.style,
        dropdownPlaceholder: form.dropdownPlaceholder || undefined,
        optionIds: form.selectedOptionIds,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async () => {
    if (!postChannelId) return;
    setPosting(true);
    try {
      await postPanel({
        panelId,
        channelId: postChannelId,
      });
      setPostChannelId(undefined);
    } catch (error) {
      console.error("Failed to post panel:", error);
      alert("Failed to post panel. Make sure the bot has permission to send messages in that channel.");
    } finally {
      setPosting(false);
    }
  };

  const handleRemoveMessage = async (id: Id<"panelMessages">) => {
    if (confirm("Remove this reference? The message will remain in Discord but won't work anymore.")) {
      await removeMessage({ id });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/${guildId}/settings/panels`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Panel</h2>
          <p className="text-muted-foreground">Configure "{panel.name}"</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Panel Settings</CardTitle>
            <CardDescription>Basic panel configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Panel Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Support Panel"
              />
              <p className="text-xs text-muted-foreground">
                Internal name for identification
              </p>
            </div>
            <Separator />
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
                <div className="w-full rounded bg-[#1e1f22] px-3 py-2 text-sm text-gray-400">
                  {form.dropdownPlaceholder || "Select a ticket type..."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post to Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Post Panel
            </CardTitle>
            <CardDescription>Send this panel to a channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <ChannelSelect
                  guildId={guildId}
                  mode="single"
                  channelTypes={["text"]}
                  value={postChannelId}
                  onValueChange={setPostChannelId}
                  placeholder="Select channel..."
                />
              </div>
              <Button onClick={handlePost} disabled={!postChannelId || posting}>
                <Send className="mr-2 h-4 w-4" />
                {posting ? "Posting..." : "Post"}
              </Button>
            </div>
            {panelMessages.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Posted Messages ({panelMessages.length})</p>
                  {panelMessages.map((pm) => (
                    <div key={pm._id} className="flex items-center justify-between rounded border p-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <DisplayChannel guildId={guildId} channelId={pm.channelId} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(pm.postedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMessage(pm._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              After editing, use <code className="rounded bg-muted px-1">/panel refresh</code> to update all posted messages.
            </p>
          </CardContent>
        </Card>

        {/* Options Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Options</CardTitle>
            <CardDescription>
              Select which ticket options appear on this panel
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

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${guildId}/settings/panels`}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
