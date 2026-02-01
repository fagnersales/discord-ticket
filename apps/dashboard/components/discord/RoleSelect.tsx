"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Shield } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@discord-ticket/convex/convex/_generated/api";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Role = {
  _id: string;
  roleId: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
};

interface RoleSelectBaseProps {
  guildId: string;
  excludeManaged?: boolean;
  excludeEveryone?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SingleSelectProps extends RoleSelectBaseProps {
  mode: "single";
  value?: string;
  onValueChange: (value: string | undefined) => void;
}

interface MultiSelectProps extends RoleSelectBaseProps {
  mode: "multi";
  values: string[];
  onValuesChange: (values: string[]) => void;
}

type RoleSelectProps = SingleSelectProps | MultiSelectProps;

function intToHex(color: number): string {
  if (color === 0) return "#99aab5";
  return `#${color.toString(16).padStart(6, "0")}`;
}

function RoleSelect(props: RoleSelectProps) {
  const {
    guildId,
    excludeManaged = true,
    excludeEveryone = true,
    placeholder = "Select role...",
    disabled = false,
    className,
    mode,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const rolesData = useQuery(api.discord.listRoles, { guildId });
  const roles = (rolesData ?? []) as Role[];

  let filteredRoles = roles;
  if (excludeManaged) {
    filteredRoles = filteredRoles.filter((r) => !r.managed);
  }
  if (excludeEveryone) {
    filteredRoles = filteredRoles.filter((r) => r.name !== "@everyone");
  }

  const searchLower = search.toLowerCase();
  const searchedRoles = filteredRoles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchLower) ||
      r.roleId.toLowerCase().includes(searchLower),
  );

  const sortedRoles = [...searchedRoles].sort((a, b) => b.position - a.position);

  const isSelected = (roleId: string) => {
    if (mode === "single") {
      return props.value === roleId;
    }
    return props.values.includes(roleId);
  };

  const handleSelect = (roleId: string) => {
    if (mode === "single") {
      props.onValueChange(props.value === roleId ? undefined : roleId);
      setOpen(false);
    } else {
      const newValues = props.values.includes(roleId)
        ? props.values.filter((v) => v !== roleId)
        : [...props.values, roleId];
      props.onValuesChange(newValues);
    }
  };

  const handleRemove = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "single") {
      props.onValueChange(undefined);
    } else {
      props.onValuesChange(props.values.filter((v) => v !== roleId));
    }
  };

  const getSelectedRoles = (): Role[] => {
    if (mode === "single") {
      const role = filteredRoles.find((r) => r.roleId === props.value);
      return role ? [role] : [];
    }
    return filteredRoles.filter((r) => props.values.includes(r.roleId));
  };

  const selectedRoles = getSelectedRoles();

  if (rolesData === undefined) {
    return (
      <Button variant="outline" disabled className={cn("w-full justify-between", className)}>
        <span className="text-muted-foreground">Loading roles...</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedRoles.length && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selectedRoles.length === 0 ? (
              placeholder
            ) : mode === "single" ? (
              <span className="flex items-center gap-2 truncate">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: intToHex(selectedRoles[0].color) }}
                />
                {selectedRoles[0].name}
              </span>
            ) : (
              selectedRoles.map((role) => (
                <Badge
                  key={role.roleId}
                  variant="secondary"
                  className="gap-1 pr-1"
                  style={{ borderColor: intToHex(role.color) }}
                >
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: intToHex(role.color) }}
                  />
                  <span className="max-w-[100px] truncate">{role.name}</span>
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    onClick={(e) => handleRemove(role.roleId, e)}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or ID..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup>
              {sortedRoles.map((role) => (
                <CommandItem
                  key={role.roleId}
                  value={role.roleId}
                  onSelect={() => handleSelect(role.roleId)}
                  className="gap-2"
                >
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: intToHex(role.color) }}
                  />
                  <span className="flex-1 truncate">{role.name}</span>
                  {role.managed && (
                    <Shield className="size-3 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground font-mono">
                    {role.roleId.slice(-6)}
                  </span>
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      isSelected(role.roleId) ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { RoleSelect };
export type { Role, RoleSelectProps };
