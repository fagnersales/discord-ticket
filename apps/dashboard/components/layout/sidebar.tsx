"use client";

import { Ticket, Settings, LayoutDashboard, ListChecks, LayoutPanelLeft, ChevronRight, Server, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
}

function NavItem({ href, icon, label, active, badge }: NavItemProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <span className={cn(
              "flex h-5 w-5 items-center justify-center transition-colors",
              active ? "text-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground"
            )}>
              {icon}
            </span>
            <span className="flex-1">{label}</span>
            {badge !== undefined && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-medium text-primary">
                {badge}
              </span>
            )}
            {active && (
              <ChevronRight className="h-4 w-4 text-sidebar-muted" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="hidden lg:hidden">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
        {title}
      </h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const guildId = params.guildId as string | undefined;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Ticket className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">Ticket Bot</span>
          <span className="text-xs text-sidebar-muted">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          <NavSection title="Overview">
            <NavItem
              href="/dashboard"
              icon={<Server className="h-4 w-4" />}
              label="Servers"
              active={pathname === "/dashboard"}
            />
          </NavSection>

          {guildId && (
            <>
              <NavSection title="Management">
                <NavItem
                  href={`/dashboard/${guildId}`}
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Dashboard"
                  active={pathname === `/dashboard/${guildId}`}
                />
                <NavItem
                  href={`/dashboard/${guildId}/tickets`}
                  icon={<Ticket className="h-4 w-4" />}
                  label="Tickets"
                  active={pathname.startsWith(`/dashboard/${guildId}/tickets`)}
                />
              </NavSection>

              <NavSection title="Configuration">
                <NavItem
                  href={`/dashboard/${guildId}/settings`}
                  icon={<Settings className="h-4 w-4" />}
                  label="Settings"
                  active={pathname === `/dashboard/${guildId}/settings`}
                />
                <NavItem
                  href={`/dashboard/${guildId}/settings/options`}
                  icon={<ListChecks className="h-4 w-4" />}
                  label="Ticket Options"
                  active={pathname.startsWith(`/dashboard/${guildId}/settings/options`)}
                />
                <NavItem
                  href={`/dashboard/${guildId}/settings/panels`}
                  icon={<LayoutPanelLeft className="h-4 w-4" />}
                  label="Panels"
                  active={pathname.startsWith(`/dashboard/${guildId}/settings/panels`)}
                />
              </NavSection>
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <NavItem
          href="https://github.com/your-repo/discord-ticket"
          icon={<HelpCircle className="h-4 w-4" />}
          label="Help & Support"
        />
      </div>
    </aside>
  );
}
