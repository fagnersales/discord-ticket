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

**Discord Sync:**
- `discordServers`, `discordChannels`, `discordRoles`, `discordMembers`, `discordEmojis` - Synced Discord data
- Full snapshot sync on bot guild join (`GuildCreate` event)
- Real-time updates via individual Discord events (channel/role/member create/update/delete)
- `GuildMembers` is a privileged intent - must be enabled in Discord Developer Portal

## Convex Guidelines

### Async Operations
Avoid using `for (const item of array) { ... }` when doing async operations against Convex. Instead use `await Promise.all(array.map(async (item) => { ... }))`.

### Discriminated Unions
When returning types with different variants, use discriminated unions instead of `v.optional` everywhere:
```typescript
// Good: Discriminated union
returns: v.union(
  v.object({ valid: v.literal(true), data: v.string() }),
  v.object({ valid: v.literal(false), error: v.string() })
)
```

### Function Syntax
Always use the function syntax with `args` and `returns` validators:
```typescript
export const myFunction = query({
  args: { id: v.id("users") },
  returns: v.string(),
  handler: async (ctx, args) => {
    // implementation
  },
});
```

### Key Rules
- Use `internalQuery/Mutation/Action` for private functions, `query/mutation/action` for public API
- **Never use `filter()` on queries** - always use `withIndex()` with a schema index
- Use `v.id(tableName)` for type-safe foreign keys
- Return `v.null()` for functions that don't return a value
- Actions cannot access `ctx.db` - use `ctx.runQuery`/`ctx.runMutation` instead

## Discord Bot Guidelines

### Custom ID Length Limit
Discord custom_ids have a **100 character limit**. When combining multiple Convex IDs (~32 chars each):
- Use short prefixes (`qty_modal` not `quantity_modal`)
- Omit IDs that can be derived from others
- Calculate total length: prefix + separators + all IDs

### Interaction Routing
When changing custom_id prefixes, **ALWAYS** update routing in the interaction handler. Forgetting this causes interactions to silently fail with no logs.

### Modal Submit Message Updates
When a modal is opened from a button on an ephemeral message:
- `defer()` → creates a **NEW** ephemeral response
- `deferMessageUpdate()` → updates the **ORIGINAL** ephemeral message the modal came from

## TypeScript Rules

- Never use `any`. Use `unknown` with type narrowing when handling external data.
- Trust the type system — avoid type assertions unless crossing a boundary (e.g., `string` → `Id<"users">`).
