# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord ticket bot with a web dashboard. Users create support tickets through Discord, staff manages them via both Discord and a Next.js dashboard.

## Commands

```bash
# First-time Convex setup (authenticate and link project)
cd packages/convex && bunx convex dev

# Development (runs all apps via Turborepo, including Convex)
bun run dev

# Run individual apps
cd apps/bot && bun run dev
cd apps/dashboard && bun run dev

# Build & type-check
bun run build
bun run typecheck
```

## Architecture

**Monorepo structure (Turborepo + Bun workspaces):**
- `apps/bot` - Discord bot using @discordjs/core (gateway-based, not discord.js)
- `apps/dashboard` - Next.js 16 dashboard with Clerk auth
- `packages/convex` - Shared Convex backend (schema, functions)

**Data flow:**
- Bot receives Discord events → writes to Convex
- Dashboard reads from Convex → displays to authenticated users
- Both apps import from `@discord-ticket/convex` workspace package for shared types

**Key patterns:**
- Bot auto-deploys slash commands on startup (no separate deploy script)
- Convex schema defines: `serverSettings`, `ticketOptions`, `ticketPanels`, `tickets`, `ticketParticipants`, `ticketMessageActions`
- Event-sourced message tracking (send/edit/delete actions stored separately)
- Clerk JWT template named "convex" required for dashboard auth
