import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "@discordjs/core";

export const panelCommand: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: "panel",
  description: "Manage ticket panels",
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: String(PermissionFlagsBits.Administrator),
  options: [
    {
      name: "post",
      description: "Post a panel to this channel",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "panel_name",
          description: "Name of the panel to post (create panels in the dashboard)",
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: "refresh",
      description: "Refresh a panel message with latest options",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "message_id",
          description: "The panel message ID to refresh",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "delete",
      description: "Delete a panel message",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "message_id",
          description: "The panel message ID to delete",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],
};
