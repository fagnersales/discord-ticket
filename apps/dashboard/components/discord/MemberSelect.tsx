"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, User } from "lucide-react";
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

type Member = {
  _id: string;
  userId: string;
  username: string;
  displayName?: string;
  avatarHash?: string;
};

interface MemberSelectBaseProps {
  guildId: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SingleSelectProps extends MemberSelectBaseProps {
  mode: "single";
  value?: string;
  onValueChange: (value: string | undefined) => void;
}

interface MultiSelectProps extends MemberSelectBaseProps {
  mode: "multi";
  values: string[];
  onValuesChange: (values: string[]) => void;
}

type MemberSelectProps = SingleSelectProps | MultiSelectProps;

function getAvatarUrl(member: Member): string | undefined {
  if (!member.avatarHash) return undefined;
  return `https://cdn.discordapp.com/avatars/${member.userId}/${member.avatarHash}.png?size=64`;
}

function getDisplayName(member: Member): string {
  return member.displayName || member.username;
}

function getInitials(member: Member): string {
  const name = getDisplayName(member);
  return name.slice(0, 2).toUpperCase();
}

function MemberSelect(props: MemberSelectProps) {
  const {
    guildId,
    placeholder = "Select member...",
    disabled = false,
    className,
    mode,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const membersData = useQuery(api.discord.listMembers, { guildId });
  const members = (membersData ?? []) as Member[];

  const searchLower = search.toLowerCase();
  const filteredMembers = members.filter(
    (m) =>
      m.username.toLowerCase().includes(searchLower) ||
      (m.displayName?.toLowerCase().includes(searchLower) ?? false) ||
      m.userId.includes(searchLower),
  );

  const sortedMembers = [...filteredMembers].sort((a, b) =>
    getDisplayName(a).localeCompare(getDisplayName(b)),
  );

  const isSelected = (userId: string) => {
    if (mode === "single") {
      return props.value === userId;
    }
    return props.values.includes(userId);
  };

  const handleSelect = (userId: string) => {
    if (mode === "single") {
      props.onValueChange(props.value === userId ? undefined : userId);
      setOpen(false);
    } else {
      const newValues = props.values.includes(userId)
        ? props.values.filter((v) => v !== userId)
        : [...props.values, userId];
      props.onValuesChange(newValues);
    }
  };

  const handleRemove = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "single") {
      props.onValueChange(undefined);
    } else {
      props.onValuesChange(props.values.filter((v) => v !== userId));
    }
  };

  const getSelectedMembers = (): Member[] => {
    if (mode === "single") {
      const member = members.find((m) => m.userId === props.value);
      return member ? [member] : [];
    }
    return members.filter((m) => props.values.includes(m.userId));
  };

  const selectedMembers = getSelectedMembers();

  if (membersData === undefined) {
    return (
      <Button variant="outline" disabled className={cn("w-full justify-between", className)}>
        <span className="text-muted-foreground">Loading members...</span>
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
            !selectedMembers.length && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selectedMembers.length === 0 ? (
              placeholder
            ) : mode === "single" ? (
              <span className="flex items-center gap-2 truncate">
                {selectedMembers[0].avatarHash ? (
                  <img
                    src={getAvatarUrl(selectedMembers[0])}
                    alt=""
                    className="size-5 rounded-full"
                  />
                ) : (
                  <div className="size-5 rounded-full bg-muted flex items-center justify-center">
                    <User className="size-3 text-muted-foreground" />
                  </div>
                )}
                {getDisplayName(selectedMembers[0])}
              </span>
            ) : (
              selectedMembers.map((member) => (
                <Badge key={member.userId} variant="secondary" className="gap-1 pr-1">
                  {member.avatarHash ? (
                    <img
                      src={getAvatarUrl(member)}
                      alt=""
                      className="size-4 rounded-full"
                    />
                  ) : (
                    <div className="size-4 rounded-full bg-muted flex items-center justify-center">
                      <User className="size-2.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{getDisplayName(member)}</span>
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    onClick={(e) => handleRemove(member.userId, e)}
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
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {sortedMembers.map((member) => (
                <CommandItem
                  key={member.userId}
                  value={member.userId}
                  onSelect={() => handleSelect(member.userId)}
                  className="gap-2"
                >
                  {member.avatarHash ? (
                    <img
                      src={getAvatarUrl(member)}
                      alt=""
                      className="size-6 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="size-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="truncate font-medium">{getDisplayName(member)}</span>
                    {member.displayName && (
                      <span className="text-xs text-muted-foreground truncate">
                        @{member.username}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {member.userId.slice(-6)}
                  </span>
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      isSelected(member.userId) ? "opacity-100" : "opacity-0",
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

export { MemberSelect };
export type { Member, MemberSelectProps };
