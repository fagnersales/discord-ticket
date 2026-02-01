"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo and brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Ticket className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Bot</h1>
          <p className="mt-2 text-muted-foreground">
            Professional support ticket management for Discord
          </p>
        </div>

        {/* Main card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to manage your server's support tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Authenticated>
              <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-10 w-10",
                      },
                    }}
                  />
                  <span className="text-sm font-medium">Ready to go</span>
                </div>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Authenticated>
            <Unauthenticated>
              <SignInButton mode="modal">
                <Button className="w-full" size="lg">
                  Sign In with Discord
                </Button>
              </SignInButton>
            </Unauthenticated>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <FeatureItem
            icon={<Zap className="h-5 w-5" />}
            title="Fast"
            description="Instant ticket creation"
          />
          <FeatureItem
            icon={<Shield className="h-5 w-5" />}
            title="Secure"
            description="Role-based access"
          />
          <FeatureItem
            icon={<BarChart3 className="h-5 w-5" />}
            title="Analytics"
            description="Track metrics"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card/50 border">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
        {icon}
      </div>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );
}
