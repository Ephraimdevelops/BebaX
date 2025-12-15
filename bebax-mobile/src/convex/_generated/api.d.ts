/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as actions_ride from "../actions/ride.js";
import type * as admin from "../admin.js";
import type * as debug from "../debug.js";
import type * as drivers from "../drivers.js";
import type * as fileUpload from "../fileUpload.js";
import type * as fleets from "../fleets.js";
import type * as lib_geohash from "../lib/geohash.js";
import type * as messages from "../messages.js";
import type * as negotiation from "../negotiation.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as payments from "../payments.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushTokens from "../pushTokens.js";
import type * as rateLimit from "../rateLimit.js";
import type * as rides from "../rides.js";
import type * as seed from "../seed.js";
import type * as sos from "../sos.js";
import type * as users from "../users.js";
import type * as utils_financial from "../utils/financial.js";
import type * as vehicles from "../vehicles.js";
import type * as verifyB2B from "../verifyB2B.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  "actions/ride": typeof actions_ride;
  admin: typeof admin;
  debug: typeof debug;
  drivers: typeof drivers;
  fileUpload: typeof fileUpload;
  fleets: typeof fleets;
  "lib/geohash": typeof lib_geohash;
  messages: typeof messages;
  negotiation: typeof negotiation;
  notifications: typeof notifications;
  organizations: typeof organizations;
  payments: typeof payments;
  pushNotifications: typeof pushNotifications;
  pushTokens: typeof pushTokens;
  rateLimit: typeof rateLimit;
  rides: typeof rides;
  seed: typeof seed;
  sos: typeof sos;
  users: typeof users;
  "utils/financial": typeof utils_financial;
  vehicles: typeof vehicles;
  verifyB2B: typeof verifyB2B;
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
