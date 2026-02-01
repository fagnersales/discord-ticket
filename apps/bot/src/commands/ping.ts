import { ApplicationCommandType, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "@discordjs/core";

export const pingCommand: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: "ping",
  description: "Check if the bot is responsive",
  type: ApplicationCommandType.ChatInput,
};
