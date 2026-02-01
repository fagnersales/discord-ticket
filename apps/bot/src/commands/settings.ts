import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "@discordjs/core";

export const settingsCommand: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: "settings",
  description: "Manage ticket bot settings",
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: String(PermissionFlagsBits.Administrator),
  options: [
    {
      name: "setup",
      description: "Initial bot setup for this server",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "category",
          description: "Category for ticket channels",
          type: ApplicationCommandOptionType.Channel,
          required: false,
        },
        {
          name: "log_channel",
          description: "Channel for ticket logs",
          type: ApplicationCommandOptionType.Channel,
          required: false,
        },
        {
          name: "max_tickets",
          description: "Maximum open tickets per user (default: 3)",
          type: ApplicationCommandOptionType.Integer,
          required: false,
          min_value: 1,
          max_value: 10,
        },
      ],
    },
    {
      name: "staff",
      description: "Manage staff roles",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Add or remove a staff role",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Add", value: "add" },
            { name: "Remove", value: "remove" },
          ],
        },
        {
          name: "role",
          description: "The role to add or remove",
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
      ],
    },
    {
      name: "admin",
      description: "Manage admin roles (can manage bot settings)",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Add or remove an admin role",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Add", value: "add" },
            { name: "Remove", value: "remove" },
          ],
        },
        {
          name: "role",
          description: "The role to add or remove",
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
      ],
    },
    {
      name: "blacklist",
      description: "Manage blacklisted users",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Add or remove a user from the blacklist",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Add", value: "add" },
            { name: "Remove", value: "remove" },
          ],
        },
        {
          name: "user",
          description: "The user to add or remove",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: "option",
      description: "Quick-add a ticket option",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Option name (e.g., 'Support', 'Sales')",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "description",
          description: "Option description",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
        {
          name: "emoji",
          description: "Option emoji",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
        {
          name: "role",
          description: "Role that can see tickets of this type",
          type: ApplicationCommandOptionType.Role,
          required: false,
        },
      ],
    },
    {
      name: "view",
      description: "View current settings",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
};
