"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  User,
  Clock,
  FileText,
  Paperclip,
} from "lucide-react";
import type { Id } from "convex/_generated/dataModel";

export default function TicketTranscriptPage() {
  const params = useParams();
  const guildId = params.guildId as string;
  const ticketId = params.ticketId as Id<"tickets">;

  const ticket = useQuery(api.tickets.get, { id: ticketId });
  const messages = useQuery(api.ticketMessages.getReconstructedMessages, { ticketId });
  const participants = useQuery(api.ticketParticipants.listByTicket, { ticketId });
  const option = useQuery(
    api.ticketOptions.get,
    ticket?.optionId ? { id: ticket.optionId } : "skip"
  );

  if (ticket === undefined || messages === undefined || participants === undefined) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!ticket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticket Not Found</CardTitle>
          <CardDescription>This ticket doesn't exist or has been deleted.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Ticket #{ticket.ticketNumber.toString().padStart(4, "0")}
          </h2>
          <p className="text-muted-foreground">
            {option?.name ?? "Unknown category"} • Created by {ticket.creatorUsername}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton ticket={ticket} messages={messages} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Messages */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcript
              </CardTitle>
              <CardDescription>
                {messages.length} message(s) in this ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages recorded
                </p>
              ) : (
                messages.map((msg) => (
                  <MessageItem key={msg.messageId} message={msg} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Ticket info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                  {ticket.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(ticket.createdAt)}</span>
              </div>
              {ticket.closedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closed</span>
                  <span>{formatDateTime(ticket.closedAt)}</span>
                </div>
              )}
              {ticket.closeReason && (
                <div className="pt-2">
                  <span className="text-muted-foreground">Close reason:</span>
                  <p className="mt-1">{ticket.closeReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal responses */}
          {ticket.modalResponses && ticket.modalResponses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Form Responses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ticket.modalResponses.map((response, i) => (
                  <div key={i}>
                    <p className="font-medium">{response.label}</p>
                    <p className="text-muted-foreground">{response.value || "-"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {participants.map((p) => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className={p.isStaff ? "font-medium" : ""}>
                    {p.displayName ?? p.username}
                    {p.isStaff && (
                      <Badge variant="outline" className="ml-2">
                        Staff
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground">{p.messageCount} msg</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface ReconstructedMessage {
  messageId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  currentContent?: string;
  originalContent?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
  }>;
  isDeleted: boolean;
  isEdited: boolean;
  isSystemMessage: boolean;
  createdAt: number;
  editHistory: Array<{ content: string; editedAt: number }>;
  deletedAt?: number;
}

function MessageItem({ message }: { message: ReconstructedMessage }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 ${
        message.isDeleted ? "bg-destructive/5 border-destructive/20" : ""
      } ${message.isSystemMessage ? "bg-muted/50" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {message.authorUsername.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-medium">
              {message.authorDisplayName ?? message.authorUsername}
            </span>
            {message.isSystemMessage && (
              <Badge variant="outline" className="ml-2">
                System
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDateTime(message.createdAt)}
          {message.isDeleted && (
            <Badge variant="destructive" className="ml-2">
              <Trash2 className="mr-1 h-3 w-3" />
              Deleted
            </Badge>
          )}
          {message.isEdited && !message.isDeleted && (
            <Badge variant="secondary" className="ml-2">
              <Edit className="mr-1 h-3 w-3" />
              Edited
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p
          className={`whitespace-pre-wrap ${
            message.isDeleted ? "text-muted-foreground italic line-through" : ""
          }`}
        >
          {message.currentContent || (message.isDeleted ? "[Content deleted]" : "[No content]")}
        </p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
              >
                <Paperclip className="h-3 w-3" />
                {att.filename}
              </a>
            ))}
          </div>
        )}

        {/* Edit history */}
        {message.isEdited && message.editHistory.length > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-auto p-0 text-xs"
            >
              {showHistory ? (
                <ChevronUp className="mr-1 h-3 w-3" />
              ) : (
                <ChevronDown className="mr-1 h-3 w-3" />
              )}
              {message.editHistory.length} previous version(s)
            </Button>

            {showHistory && (
              <div className="mt-2 space-y-2 border-l-2 pl-3">
                {message.originalContent && (
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {message.originalContent}
                    </p>
                  </div>
                )}
                {message.editHistory.map((edit, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-xs text-muted-foreground">
                      Edit at {formatDateTime(edit.editedAt)}
                    </p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {edit.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExportButton({
  ticket,
  messages,
}: {
  ticket: any;
  messages: ReconstructedMessage[];
}) {
  const handleExportText = () => {
    let content = `Ticket #${ticket.ticketNumber.toString().padStart(4, "0")}\n`;
    content += `Created by: ${ticket.creatorUsername}\n`;
    content += `Status: ${ticket.status}\n`;
    content += `Created: ${formatDateTime(ticket.createdAt)}\n`;
    if (ticket.closedAt) {
      content += `Closed: ${formatDateTime(ticket.closedAt)}\n`;
    }
    content += `\n${"=".repeat(50)}\n\n`;

    for (const msg of messages) {
      content += `[${formatDateTime(msg.createdAt)}] ${msg.authorUsername}`;
      if (msg.isDeleted) content += " [DELETED]";
      if (msg.isEdited) content += " [EDITED]";
      content += `:\n${msg.currentContent || "[No content]"}\n\n`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${ticket.ticketNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket #${ticket.ticketNumber.toString().padStart(4, "0")}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #1a1a1a; color: #e0e0e0; }
    h1 { color: #fff; }
    .meta { color: #888; margin-bottom: 20px; }
    .message { border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #222; }
    .message.deleted { background: #2a1a1a; border-color: #4a2020; }
    .message.system { background: #252525; }
    .header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .author { font-weight: bold; }
    .time { color: #888; font-size: 0.9em; }
    .badge { font-size: 0.75em; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
    .badge.deleted { background: #4a2020; color: #ff6b6b; }
    .badge.edited { background: #2a2a2a; color: #888; }
    .content { white-space: pre-wrap; }
    .deleted-content { color: #888; text-decoration: line-through; font-style: italic; }
  </style>
</head>
<body>
  <h1>Ticket #${ticket.ticketNumber.toString().padStart(4, "0")}</h1>
  <div class="meta">
    <p>Created by: ${ticket.creatorUsername}</p>
    <p>Status: ${ticket.status}</p>
    <p>Created: ${formatDateTime(ticket.createdAt)}</p>
    ${ticket.closedAt ? `<p>Closed: ${formatDateTime(ticket.closedAt)}</p>` : ""}
  </div>
  <hr>
`;

    for (const msg of messages) {
      const classes = [
        "message",
        msg.isDeleted ? "deleted" : "",
        msg.isSystemMessage ? "system" : "",
      ]
        .filter(Boolean)
        .join(" ");

      html += `  <div class="${classes}">
    <div class="header">
      <span class="author">${msg.authorUsername}</span>
      <span class="time">${formatDateTime(msg.createdAt)}${msg.isDeleted ? '<span class="badge deleted">Deleted</span>' : ""}${msg.isEdited ? '<span class="badge edited">Edited</span>' : ""}</span>
    </div>
    <div class="content${msg.isDeleted ? " deleted-content" : ""}">${escapeHtml(msg.currentContent || "[No content]")}</div>
  </div>
`;
    }

    html += `</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${ticket.ticketNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportText}>
        <Download className="mr-2 h-4 w-4" />
        Export TXT
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportHtml}>
        <Download className="mr-2 h-4 w-4" />
        Export HTML
      </Button>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "warning" | "success"> = {
    low: "success",
    normal: "default",
    high: "warning",
    urgent: "destructive",
  };

  return <Badge variant={variants[priority] ?? "default"}>{priority}</Badge>;
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
