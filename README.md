# Discord Ticket

A Discord ticket bot with a web dashboard. Users create support tickets through Discord, and staff can manage them via both Discord and a Next.js dashboard.

## Features

- Create support tickets via Discord buttons or dropdown menus
- Configurable ticket panels with custom embeds
- Web dashboard for managing tickets and settings
- Real-time sync between Discord and dashboard
- Multiple ticket options per panel
- Message tracking (send/edit/delete history)

## Tech Stack

- **Monorepo**: Turborepo + Bun workspaces
- **Bot**: @discordjs/core (gateway-based)
- **Dashboard**: Next.js 16 + React 19 + Tailwind CSS
- **Backend**: Convex (real-time database)
- **Auth**: Clerk

## Project Structure

```
├── apps/
│   ├── bot/          # Discord bot
│   └── dashboard/    # Next.js web dashboard
└── packages/
    └── convex/       # Shared Convex backend (schema, functions)
```

## Prerequisites

- [Bun](https://bun.sh/) (v1.3+)
- [Convex](https://convex.dev/) account
- [Clerk](https://clerk.com/) account
- Discord application with bot token

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/fagnersales/discord-ticket.git
cd discord-ticket
bun install
```

### 2. Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **Bot** → Create bot and copy the token
4. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
5. Go to **OAuth2** → Generate an invite URL with scopes: `bot`, `applications.commands`
6. Invite the bot to your server

### 3. Clerk Setup

1. Create a project at [Clerk](https://clerk.com/)
2. Go to **JWT Templates** → Create a new template named `convex`
3. Copy your Clerk keys

### 4. Convex Setup

```bash
cd packages/convex
bunx convex dev
```

This will prompt you to log in and create a new Convex project.

After setup, add the `DISCORD_TOKEN` environment variable in the Convex dashboard:
1. Go to https://dashboard.convex.dev
2. Select your project → Settings → Environment Variables
3. Add `DISCORD_TOKEN` with your bot token

### 5. Environment Variables

**apps/bot/.env**
```env
DISCORD_TOKEN=your_bot_token
CONVEX_URL=your_convex_url
```

**apps/dashboard/.env.local**
```env
CONVEX_URL=your_convex_url
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 6. Run Development Servers

```bash
# Run all apps (bot, dashboard, convex)
bun run dev

# Or run individually
cd apps/bot && bun run dev
cd apps/dashboard && bun run dev
cd packages/convex && bunx convex dev
```

The dashboard will be available at http://localhost:3000

## Usage

1. Open the dashboard and sign in with Clerk
2. Select a Discord server where the bot is installed
3. Go to **Settings** → **Options** to create ticket types
4. Go to **Settings** → **Panels** to create a ticket panel
5. Use the **Send** button to post the panel to a Discord channel
6. Users can now click buttons/dropdown to create tickets

## License

MIT
