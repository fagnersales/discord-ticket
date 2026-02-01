"use client";

import { UserButton } from "@clerk/nextjs";

export default function Dashboard() {
  return (
    <main>
      <header>
        <h1>Dashboard</h1>
        <UserButton />
      </header>
      <section>
        <h2>Select a Server</h2>
        <p>Your servers will appear here once configured.</p>
      </section>
    </main>
  );
}
