"use client";

import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";
import { Badge } from "@/components/ui/badge";

function intToHex(color: number): string {
  if (color === 0) return "#99aab5";
  return `#${color.toString(16).padStart(6, "0")}`;
}

interface DisplayRoleProps {
  guildId: string;
  roleId: string;
  variant?: "badge" | "inline";
}

export function DisplayRole({ guildId, roleId, variant = "badge" }: DisplayRoleProps) {
  const roles = useQuery(api.discord.listRoles, { guildId });

  if (roles === undefined) {
    return variant === "badge" ? (
      <Badge variant="secondary">Loading...</Badge>
    ) : (
      <span className="text-muted-foreground">Loading...</span>
    );
  }

  const role = roles.find((r) => r.roleId === roleId);

  if (!role) {
    return variant === "badge" ? (
      <Badge variant="secondary">Unknown role</Badge>
    ) : (
      <span className="text-muted-foreground">Unknown role</span>
    );
  }

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: intToHex(role.color) }}
        />
        <span>{role.name}</span>
      </span>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1"
      style={{ borderColor: intToHex(role.color) }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: intToHex(role.color) }}
      />
      {role.name}
    </Badge>
  );
}

interface DisplayRolesProps {
  guildId: string;
  roleIds: string[];
  emptyText?: string;
  variant?: "badge" | "inline";
}

export function DisplayRoles({ guildId, roleIds, emptyText = "None", variant = "badge" }: DisplayRolesProps) {
  const roles = useQuery(api.discord.listRoles, { guildId });

  if (roleIds.length === 0) {
    return <span className="text-muted-foreground">{emptyText}</span>;
  }

  if (roles === undefined) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  const matchedRoles = roleIds
    .map((id) => roles.find((r) => r.roleId === id))
    .filter(Boolean);

  if (matchedRoles.length === 0) {
    return <span className="text-muted-foreground">Unknown roles</span>;
  }

  if (variant === "inline") {
    return (
      <span>
        {matchedRoles.map((role, i) => (
          <span key={role!.roleId}>
            {i > 0 && ", "}
            <span className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full inline-block"
                style={{ backgroundColor: intToHex(role!.color) }}
              />
              {role!.name}
            </span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {matchedRoles.map((role) => (
        <Badge
          key={role!.roleId}
          variant="secondary"
          className="gap-1"
          style={{ borderColor: intToHex(role!.color) }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: intToHex(role!.color) }}
          />
          {role!.name}
        </Badge>
      ))}
    </div>
  );
}
