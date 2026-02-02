/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as discord from "../discord.js";
import type * as lib_placeholders from "../lib/placeholders.js";
import type * as panelActions from "../panelActions.js";
import type * as serverSettings from "../serverSettings.js";
import type * as ticketMessages from "../ticketMessages.js";
import type * as ticketOptions from "../ticketOptions.js";
import type * as ticketPanels from "../ticketPanels.js";
import type * as ticketParticipants from "../ticketParticipants.js";
import type * as tickets from "../tickets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  discord: typeof discord;
  "lib/placeholders": typeof lib_placeholders;
  panelActions: typeof panelActions;
  serverSettings: typeof serverSettings;
  ticketMessages: typeof ticketMessages;
  ticketOptions: typeof ticketOptions;
  ticketPanels: typeof ticketPanels;
  ticketParticipants: typeof ticketParticipants;
  tickets: typeof tickets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
