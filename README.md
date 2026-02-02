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
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_issuer_domain
NEXT_PUBLIC_DISCORD_APPLICATION_ID=your_discord_application_id
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

## Deployment

### Convex Environment Variables

In the [Convex Dashboard](https://dashboard.convex.dev), add these environment variables to your **production** deployment:

- `CLERK_JWT_ISSUER_DOMAIN` - Your Clerk JWT issuer domain (e.g., `https://your-app.clerk.accounts.dev`)
- `DISCORD_TOKEN` - Your Discord bot token

### Railway (Bot)

1. Create a new project in [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Add these environment variables:

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_APPLICATION_ID` | Application ID from Discord Developer Portal |
| `DISCORD_PUBLIC_KEY` | Public key from Discord Developer Portal |
| `CONVEX_URL` | Your Convex production URL (e.g., `https://your-project.convex.cloud`) |
| `CONVEX_DEPLOYMENT` | Your Convex deployment (e.g., `prod:your-project`) |

The `railway.toml` in the repo root handles build and start commands automatically.

### Vercel (Dashboard)

1. Create a new project in [Vercel](https://vercel.com/)
2. Connect your GitHub repository
3. Set **Root Directory** to `apps/dashboard`
4. Add these environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain |
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex production URL |
| `NEXT_PUBLIC_DISCORD_APPLICATION_ID` | Discord application ID (for bot invite button) |
| `CONVEX_DEPLOY_KEY` | Deploy key from Convex dashboard (optional, for auto-deploy) |

5. (Optional) To auto-deploy Convex with the dashboard, set the **Build Command** to:

```
bunx convex deploy --cmd 'bun run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

## Usage

1. Open the dashboard and sign in with Clerk
2. Select a Discord server where the bot is installed
3. Go to **Settings** → **Options** to create ticket types
4. Go to **Settings** → **Panels** to create a ticket panel
5. Use the **Send** button to post the panel to a Discord channel
6. Users can now click buttons/dropdown to create tickets

## License

MIT
