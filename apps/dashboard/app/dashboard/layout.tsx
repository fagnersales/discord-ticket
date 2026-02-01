"use client";

import { UserButton } from "@clerk/nextjs";
import { Ticket, Settings, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const guildId = params.guildId as string | undefined;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Ticket className="h-6 w-6 text-primary" />
          <span className="font-semibold">Ticket Dashboard</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          <Link href="/dashboard">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Servers
            </Button>
          </Link>
          {guildId && (
            <>
              <Separator className="my-2" />
              <Link href={`/dashboard/${guildId}`}>
                <Button
                  variant={pathname === `/dashboard/${guildId}` ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Overview
                </Button>
              </Link>
              <Link href={`/dashboard/${guildId}/tickets`}>
                <Button
                  variant={pathname.includes("/tickets") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  Tickets
                </Button>
              </Link>
              <Link href={`/dashboard/${guildId}/settings`}>
                <Button
                  variant={pathname.includes("/settings") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <UserButton />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
