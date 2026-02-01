import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "@discordjs/core";

export const ticketCommand: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: "ticket",
  description: "Manage tickets",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "close",
      description: "Close the current ticket",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "reason",
          description: "Reason for closing the ticket",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "add",
      description: "Add a user to the current ticket",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user to add",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: "remove",
      description: "Remove a user from the current ticket",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user to remove",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: "priority",
      description: "Set the ticket priority",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "level",
          description: "The priority level",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "🟢 Low", value: "low" },
            { name: "🟡 Normal", value: "normal" },
            { name: "🟠 High", value: "high" },
            { name: "🔴 Urgent", value: "urgent" },
          ],
        },
      ],
    },
    {
      name: "rename",
      description: "Rename the ticket channel",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "The new channel name",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],
};
