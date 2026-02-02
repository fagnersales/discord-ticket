"use client";

import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { Search, ChevronRight, Server } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export function Header() {
  const params = useParams();
  const pathname = usePathname();
  const guildId = params.guildId as string | undefined;

  const server = useQuery(
    api.discord.getServer,
    guildId ? { guildId } : "skip"
  );

  // Build breadcrumb items based on current path
  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Servers", href: "/dashboard" },
  ];

  if (guildId && server) {
    breadcrumbItems.push({
      label: server.name,
      href: `/dashboard/${guildId}`,
    });

    if (pathname.includes("/tickets")) {
      if (params.ticketId) {
        breadcrumbItems.push({
          label: "Tickets",
          href: `/dashboard/${guildId}/tickets`,
        });
        breadcrumbItems.push({ label: `Ticket #${params.ticketId}` });
      } else {
        breadcrumbItems.push({ label: "Tickets" });
      }
    } else if (pathname.includes("/settings")) {
      if (pathname.includes("/options")) {
        breadcrumbItems.push({
          label: "Settings",
          href: `/dashboard/${guildId}/settings`,
        });
        if (pathname.includes("/new")) {
          breadcrumbItems.push({
            label: "Options",
            href: `/dashboard/${guildId}/settings/options`,
          });
          breadcrumbItems.push({ label: "New Option" });
        } else if (params.optionId) {
          breadcrumbItems.push({
            label: "Options",
            href: `/dashboard/${guildId}/settings/options`,
          });
          breadcrumbItems.push({ label: "Edit Option" });
        } else {
          breadcrumbItems.push({ label: "Options" });
        }
      } else if (pathname.includes("/panels")) {
        breadcrumbItems.push({
          label: "Settings",
          href: `/dashboard/${guildId}/settings`,
        });
        if (pathname.includes("/new")) {
          breadcrumbItems.push({
            label: "Panels",
            href: `/dashboard/${guildId}/settings/panels`,
          });
          breadcrumbItems.push({ label: "New Panel" });
        } else if (params.panelId) {
          breadcrumbItems.push({
            label: "Panels",
            href: `/dashboard/${guildId}/settings/panels`,
          });
          breadcrumbItems.push({ label: "Edit Panel" });
        } else {
          breadcrumbItems.push({ label: "Panels" });
        }
      } else {
        breadcrumbItems.push({ label: "Settings" });
      }
    } else if (pathname === `/dashboard/${guildId}`) {
      breadcrumbItems.pop(); // Remove the server link since we're on that page
      breadcrumbItems.push({ label: server.name });
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {/* Server icon if on a guild page */}
        {guildId && server && (
          <div className="flex items-center gap-3">
            {server.iconHash ? (
              <img
                src={`https://cdn.discordapp.com/icons/${guildId}/${server.iconHash}.${server.iconHash.startsWith("a_") ? "gif" : "png"}?size=64`}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input"
          />
        </div>

        {/* User */}
        <div className="ml-2 flex items-center gap-3 border-l pl-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
