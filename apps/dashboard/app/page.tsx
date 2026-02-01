"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main>
      <h1>Discord Ticket Bot</h1>
      <Authenticated>
        <UserButton />
        <a href="/dashboard">Go to Dashboard</a>
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </main>
  );
}
