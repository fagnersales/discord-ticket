// Placeholder replacement utility for ticket messages (bot-side version)

export interface PlaceholderContext {
  user: {
    id: string;
    username: string;
    displayName?: string;
    mention: string;
  };
  ticket: {
    number: number;
    channelId: string;
    channelMention: string;
  };
  option: {
    name: string;
  };
  modal?: Record<string, string>; // fieldId -> value
  server: {
    name: string;
  };
}

const placeholderPattern = /\{([^}]+)\}/g;

export function replacePlaceholders(template: string, context: PlaceholderContext): string {
  return template.replace(placeholderPattern, (match, key: string) => {
    // Handle modal field placeholders like {modal:reason}
    if (key.startsWith("modal:")) {
      const fieldId = key.slice(6);
      return context.modal?.[fieldId] ?? match;
    }

    // Handle standard placeholders
    switch (key) {
      case "user":
        return context.user.mention;
      case "user.id":
        return context.user.id;
      case "user.username":
        return context.user.username;
      case "user.displayName":
        return context.user.displayName ?? context.user.username;
      case "username":
        return context.user.username;
      case "ticketNumber":
        return context.ticket.number.toString().padStart(4, "0");
      case "ticket.number":
        return context.ticket.number.toString();
      case "ticket.channel":
        return context.ticket.channelMention;
      case "option":
      case "option.name":
        return context.option.name;
      case "server":
      case "server.name":
        return context.server.name;
      default:
        return match;
    }
  });
}

export function replaceChannelNamePlaceholders(
  template: string,
  context: Pick<PlaceholderContext, "user" | "ticket" | "option">
): string {
  const result = template.replace(placeholderPattern, (match, key: string) => {
    switch (key) {
      case "username":
        return context.user.username;
      case "user.username":
        return context.user.username;
      case "ticketNumber":
        return context.ticket.number.toString().padStart(4, "0");
      case "ticket.number":
        return context.ticket.number.toString();
      case "option":
      case "option.name":
        return context.option.name;
      default:
        return match;
    }
  });

  // Sanitize for Discord channel names
  return result
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 100);
}
