"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Hash, Volume2, FolderOpen, X } from "lucide-react";
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

type ChannelType = "text" | "voice" | "category";

type BaseChannel = {
  _id: string;
  channelId: string;
  name: string;
  parentId?: string;
  position: number;
};

type TextChannel = BaseChannel & { channelType: "text" };
type VoiceChannel = BaseChannel & { channelType: "voice" };
type CategoryChannel = BaseChannel & { channelType: "category" };

type Channel = TextChannel | VoiceChannel | CategoryChannel;

interface ChannelSelectBaseProps {
  guildId: string;
  channelTypes?: ChannelType[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SingleSelectProps extends ChannelSelectBaseProps {
  mode: "single";
  value?: string;
  onValueChange: (value: string | undefined) => void;
}

interface MultiSelectProps extends ChannelSelectBaseProps {
  mode: "multi";
  values: string[];
  onValuesChange: (values: string[]) => void;
}

type ChannelSelectProps = SingleSelectProps | MultiSelectProps;

const channelIcons: Record<ChannelType, React.ElementType> = {
  text: Hash,
  voice: Volume2,
  category: FolderOpen,
};

function getChannelIcon(type: ChannelType) {
  const Icon = channelIcons[type];
  return <Icon className="size-4 shrink-0 text-muted-foreground" />;
}

type GroupedChannels = {
  categoryName: string;
  categoryId: string | null;
  channels: Channel[];
};

function groupChannelsByCategory(
  channels: Channel[],
  allChannels: Channel[],
): GroupedChannels[] {
  const categories = allChannels.filter(
    (c): c is CategoryChannel => c.channelType === "category",
  );

  const categoryMap = new Map<string, CategoryChannel>();
  for (const cat of categories) {
    categoryMap.set(cat.channelId, cat);
  }

  const grouped = new Map<string | null, Channel[]>();

  const sortedChannels = [...channels].sort((a, b) => a.position - b.position);

  for (const channel of sortedChannels) {
    const parentId = channel.parentId ?? null;
    if (!grouped.has(parentId)) {
      grouped.set(parentId, []);
    }
    grouped.get(parentId)!.push(channel);
  }

  const result: GroupedChannels[] = [];

  const sortedCategories = [...categories].sort(
    (a, b) => a.position - b.position,
  );

  for (const category of sortedCategories) {
    const channelsInCategory = grouped.get(category.channelId);
    if (channelsInCategory && channelsInCategory.length > 0) {
      result.push({
        categoryName: category.name,
        categoryId: category.channelId,
        channels: channelsInCategory,
      });
    }
  }

  const uncategorized = grouped.get(null);
  if (uncategorized && uncategorized.length > 0) {
    result.push({
      categoryName: "Uncategorized",
      categoryId: null,
      channels: uncategorized,
    });
  }

  return result;
}

function ChannelSelect(props: ChannelSelectProps) {
  const {
    guildId,
    channelTypes = ["text", "voice", "category"],
    placeholder = "Select channel...",
    disabled = false,
    className,
    mode,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const channelsData = useQuery(api.discord.listChannels, { guildId });
  const channels = (channelsData ?? []) as Channel[];

  const filteredByType = channels.filter((c) =>
    channelTypes.includes(c.channelType),
  );

  const searchLower = search.toLowerCase();
  const filteredChannels = filteredByType.filter(
    (c) =>
      c.name.toLowerCase().includes(searchLower) ||
      c.channelId.toLowerCase().includes(searchLower),
  );

  const showCategories = channelTypes.length === 1 && channelTypes[0] !== "category";
  const groupedChannels = showCategories
    ? groupChannelsByCategory(filteredChannels, channels)
    : [{ categoryName: "", categoryId: null, channels: filteredChannels.sort((a, b) => a.position - b.position) }];

  const isSelected = (channelId: string) => {
    if (mode === "single") {
      return props.value === channelId;
    }
    return props.values.includes(channelId);
  };

  const handleSelect = (channelId: string) => {
    if (mode === "single") {
      props.onValueChange(props.value === channelId ? undefined : channelId);
      setOpen(false);
    } else {
      const newValues = props.values.includes(channelId)
        ? props.values.filter((v) => v !== channelId)
        : [...props.values, channelId];
      props.onValuesChange(newValues);
    }
  };

  const handleRemove = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "single") {
      props.onValueChange(undefined);
    } else {
      props.onValuesChange(props.values.filter((v) => v !== channelId));
    }
  };

  const getSelectedChannels = (): Channel[] => {
    if (mode === "single") {
      const channel = filteredByType.find((c) => c.channelId === props.value);
      return channel ? [channel] : [];
    }
    return filteredByType.filter((c) => props.values.includes(c.channelId));
  };

  const selectedChannels = getSelectedChannels();

  if (channelsData === undefined) {
    return (
      <Button variant="outline" disabled className={cn("w-full justify-between", className)}>
        <span className="text-muted-foreground">Loading channels...</span>
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
            !selectedChannels.length && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selectedChannels.length === 0 ? (
              placeholder
            ) : mode === "single" ? (
              <span className="flex items-center gap-2 truncate">
                {getChannelIcon(selectedChannels[0].channelType)}
                {selectedChannels[0].name}
              </span>
            ) : (
              selectedChannels.map((channel) => (
                <Badge key={channel.channelId} variant="secondary" className="gap-1 pr-1">
                  {getChannelIcon(channel.channelType)}
                  <span className="max-w-[100px] truncate">{channel.name}</span>
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    onClick={(e) => handleRemove(channel.channelId, e)}
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
            <CommandEmpty>No channels found.</CommandEmpty>
            {groupedChannels.map((group) => (
              <CommandGroup
                key={group.categoryId ?? "uncategorized"}
                heading={showCategories ? group.categoryName : undefined}
              >
                {group.channels.map((channel) => (
                  <CommandItem
                    key={channel.channelId}
                    value={channel.channelId}
                    onSelect={() => handleSelect(channel.channelId)}
                    className="gap-2"
                  >
                    {getChannelIcon(channel.channelType)}
                    <span className="flex-1 truncate">{channel.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {channel.channelId.slice(-6)}
                    </span>
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isSelected(channel.channelId) ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ChannelSelect };
export type { Channel, ChannelType, ChannelSelectProps };
