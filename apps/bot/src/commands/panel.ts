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
      name: "create",
      description: "Create a new ticket panel in this channel",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "style",
          description: "Panel style",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Buttons", value: "buttons" },
            { name: "Dropdown", value: "dropdown" },
          ],
        },
        {
          name: "title",
          description: "Panel embed title",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
        {
          name: "description",
          description: "Panel embed description",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
        {
          name: "color",
          description: "Panel embed color (hex without #)",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "delete",
      description: "Delete a ticket panel",
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
    {
      name: "refresh",
      description: "Refresh a ticket panel's buttons/options",
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
  ],
};
