"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Ticket className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Discord Ticket Bot</CardTitle>
          <CardDescription>
            Manage your server's support tickets from a central dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Authenticated>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">Signed in</span>
              <UserButton />
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button className="w-full">Sign In to Continue</Button>
            </SignInButton>
          </Unauthenticated>
        </CardContent>
      </Card>
    </main>
  );
}
