import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Discord permission flag for Administrator
const ADMINISTRATOR = BigInt(0x8);

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(userId, "discord");

    if (!tokens.data || tokens.data.length === 0) {
      return NextResponse.json(
        { error: "No Discord account linked. Please sign in with Discord." },
        { status: 400 },
      );
    }

    const accessToken = tokens.data[0].token;

    // Fetch user's guilds from Discord API
    const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Discord API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch Discord guilds" },
        { status: response.status },
      );
    }

    const guilds: DiscordGuild[] = await response.json();

    // Filter to only guilds where user is owner or has Administrator permission
    const adminGuilds = guilds.filter((guild) => {
      if (guild.owner) return true;
      const permissions = BigInt(guild.permissions);
      return (permissions & ADMINISTRATOR) === ADMINISTRATOR;
    });

    // Return simplified guild data
    return NextResponse.json(
      adminGuilds.map((guild) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner,
      })),
    );
  } catch (error) {
    console.error("Error fetching Discord guilds:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
