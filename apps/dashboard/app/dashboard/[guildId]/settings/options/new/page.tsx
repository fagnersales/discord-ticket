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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import { ChannelSelect, RoleSelect } from "@/components/discord";

export default function NewOptionPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const settings = useQuery(api.serverSettings.getByGuildId, { guildId });
  const createOption = useMutation(api.ticketOptions.create);

  const [form, setForm] = useState({
    name: "",
    description: "",
    emoji: "",
    channelNameTemplate: "ticket-{ticketNumber}",
    categoryId: undefined as string | undefined,
    responsibleRoleIds: [] as string[],
    useModal: false,
    modalTitle: "",
    modalFields: [] as Array<{
      id: string;
      label: string;
      placeholder: string;
      style: "short" | "paragraph";
      required: boolean;
    }>,
    initialMessageContent: "",
    initialMessageTitle: "",
    initialMessageDescription: "",
  });

  const [saving, setSaving] = useState(false);

  if (settings === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Not Configured</CardTitle>
          <CardDescription>
            Run <code className="rounded bg-muted px-1 py-0.5">/settings setup</code> in Discord first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      await createOption({
        guildId,
        name: form.name.trim(),
        description: form.description || undefined,
        emoji: form.emoji || undefined,
        channelNameTemplate: form.channelNameTemplate || "ticket-{ticketNumber}",
        categoryId: form.categoryId,
        responsibleRoleIds: form.responsibleRoleIds.length > 0
          ? form.responsibleRoleIds
          : settings.staffRoleIds,
        useModal: form.useModal,
        modalTitle: form.modalTitle || undefined,
        modalFields: form.useModal
          ? form.modalFields.map((f) => ({
              id: f.id,
              label: f.label,
              placeholder: f.placeholder || undefined,
              style: f.style,
              required: f.required,
            }))
          : undefined,
        initialMessage:
          form.initialMessageContent || form.initialMessageTitle || form.initialMessageDescription
            ? {
                content: form.initialMessageContent || undefined,
                embed:
                  form.initialMessageTitle || form.initialMessageDescription
                    ? {
                        title: form.initialMessageTitle || undefined,
                        description: form.initialMessageDescription || undefined,
                      }
                    : undefined,
              }
            : undefined,
      });
      router.push(`/dashboard/${guildId}/settings/options`);
    } finally {
      setSaving(false);
    }
  };

  const addModalField = () => {
    setForm({
      ...form,
      modalFields: [
        ...form.modalFields,
        {
          id: `field_${Date.now()}`,
          label: "",
          placeholder: "",
          style: "short",
          required: true,
        },
      ],
    });
  };

  const removeModalField = (index: number) => {
    setForm({
      ...form,
      modalFields: form.modalFields.filter((_, i) => i !== index),
    });
  };

  const updateModalField = (index: number, updates: Partial<(typeof form.modalFields)[0]>) => {
    const newFields = [...form.modalFields];
    newFields[index] = { ...newFields[index], ...updates };
    setForm({ ...form, modalFields: newFields });
  };

  const isValid = form.name.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/${guildId}/settings/options`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Ticket Option</h2>
          <p className="text-muted-foreground">Create a new ticket type</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
            <CardDescription>General option configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Support"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Get help with general questions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                placeholder="📋"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelName">Channel Name Template</Label>
              <Input
                id="channelName"
                value={form.channelNameTemplate}
                onChange={(e) => setForm({ ...form, channelNameTemplate: e.target.value })}
                placeholder="ticket-{ticketNumber}"
              />
              <p className="text-xs text-muted-foreground">
                Available: {"{ticketNumber}"}, {"{username}"}, {"{option}"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category & Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Category & Roles</CardTitle>
            <CardDescription>Where tickets are created and who manages them</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category Override</Label>
              <ChannelSelect
                guildId={guildId}
                mode="single"
                channelTypes={["category"]}
                value={form.categoryId}
                onValueChange={(value) => setForm({ ...form, categoryId: value })}
                placeholder="Use default category..."
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default ticket category
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Responsible Roles</Label>
              <RoleSelect
                guildId={guildId}
                mode="multi"
                values={form.responsibleRoleIds}
                onValuesChange={(values) => setForm({ ...form, responsibleRoleIds: values })}
                placeholder="Use staff roles..."
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use server staff roles
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Initial Message */}
        <Card>
          <CardHeader>
            <CardTitle>Initial Message</CardTitle>
            <CardDescription>Message sent when ticket is created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="msgContent">Message Content</Label>
              <Textarea
                id="msgContent"
                value={form.initialMessageContent}
                onChange={(e) => setForm({ ...form, initialMessageContent: e.target.value })}
                placeholder="Optional text above the embed"
              />
            </div>
            <Separator />
            <p className="text-sm font-medium">Embed</p>
            <div className="space-y-2">
              <Label htmlFor="embedTitle">Title</Label>
              <Input
                id="embedTitle"
                value={form.initialMessageTitle}
                onChange={(e) => setForm({ ...form, initialMessageTitle: e.target.value })}
                placeholder="Ticket #{ticketNumber}"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="embedDesc">Description</Label>
              <Textarea
                id="embedDesc"
                value={form.initialMessageDescription}
                onChange={(e) => setForm({ ...form, initialMessageDescription: e.target.value })}
                placeholder="Welcome {user}! A staff member will assist you shortly."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {"{user}"}, {"{username}"}, {"{ticketNumber}"}, {"{option}"},{" "}
              {"{modal:fieldId}"}
            </p>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How this option will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                  {form.emoji || "📋"}
                </div>
                <div>
                  <p className="font-medium">{form.name || "Option Name"}</p>
                  {form.description && (
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Modal Form</CardTitle>
                <CardDescription>Ask questions before creating the ticket</CardDescription>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.useModal}
                  onChange={(e) => setForm({ ...form, useModal: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">Enable modal</span>
              </label>
            </div>
          </CardHeader>
          {form.useModal && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modalTitle">Modal Title</Label>
                <Input
                  id="modalTitle"
                  value={form.modalTitle}
                  onChange={(e) => setForm({ ...form, modalTitle: e.target.value })}
                  placeholder="Create Support Ticket"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Fields ({form.modalFields.length}/5)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addModalField}
                    disabled={form.modalFields.length >= 5}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>

                {form.modalFields.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No fields added yet. Click "Add Field" to create a form question.
                  </p>
                )}

                {form.modalFields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <Badge variant="outline">Field {index + 1}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModalField(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateModalField(index, { label: e.target.value })}
                          placeholder="What's your issue?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) => updateModalField(index, { placeholder: e.target.value })}
                          placeholder="Describe your issue..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={field.style === "short"}
                          onChange={() => updateModalField(index, { style: "short" })}
                        />
                        <span className="text-sm">Short text</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={field.style === "paragraph"}
                          onChange={() => updateModalField(index, { style: "paragraph" })}
                        />
                        <span className="text-sm">Paragraph</span>
                      </label>
                      <label className="ml-auto flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateModalField(index, { required: e.target.checked })}
                          className="rounded border-input"
                        />
                        <span className="text-sm">Required</span>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Field ID: <code className="rounded bg-muted px-1">{field.id}</code> - Use{" "}
                      {"{modal:" + field.id + "}"} in messages
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${guildId}/settings/options`}>Cancel</Link>
        </Button>
        <Button onClick={handleCreate} disabled={saving || !isValid}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Creating..." : "Create Option"}
        </Button>
      </div>
    </div>
  );
}
