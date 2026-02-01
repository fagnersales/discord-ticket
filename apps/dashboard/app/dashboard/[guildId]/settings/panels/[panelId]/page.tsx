"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Eye } from "lucide-react";
import Link from "next/link";
import type { Id } from "convex/_generated/dataModel";

export default function EditPanelPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;
  const panelId = params.panelId as Id<"ticketPanels">;

  const panel = useQuery(api.ticketPanels.get, { id: panelId });
  const options = useQuery(api.ticketOptions.listByGuild, { guildId });
  const updatePanel = useMutation(api.ticketPanels.update);

  const [form, setForm] = useState({
    title: "",
    description: "",
    color: "",
    dropdownPlaceholder: "",
    selectedOptionIds: [] as Id<"ticketOptions">[],
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (panel) {
      setForm({
        title: panel.embed.title ?? "",
        description: panel.embed.description ?? "",
        color: panel.embed.color?.toString(16).padStart(6, "0") ?? "",
        dropdownPlaceholder: panel.dropdownPlaceholder ?? "",
        selectedOptionIds: panel.optionIds,
      });
    }
  }, [panel]);

  if (panel === undefined || options === undefined) {
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
        embed: {
          title: form.title || undefined,
          description: form.description || undefined,
          color: form.color ? parseInt(form.color, 16) : undefined,
        },
        dropdownPlaceholder: form.dropdownPlaceholder || undefined,
        optionIds: form.selectedOptionIds,
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
          <p className="text-muted-foreground">
            Configure panel embed and options
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
            {panel.style === "dropdown" && (
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
              {panel.style === "buttons" ? (
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

        {/* Options Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Options</CardTitle>
            <CardDescription>
              Select which ticket options appear on this panel
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            <p className="mt-4 text-sm text-muted-foreground">
              After saving, use <code className="rounded bg-muted px-1">/panel refresh</code> with
              the message ID to update the panel in Discord.
            </p>
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
