/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAnalytics from "../adminAnalytics.js";
import type * as adminArtifacts from "../adminArtifacts.js";
import type * as adminAuth from "../adminAuth.js";
import type * as adminChallenges from "../adminChallenges.js";
import type * as adminExcavationSites from "../adminExcavationSites.js";
import type * as adminUsers from "../adminUsers.js";
import type * as artifactGame from "../artifactGame.js";
import type * as artifacts from "../artifacts.js";
import type * as challenges from "../challenges.js";
import type * as excavationGame from "../excavationGame.js";
import type * as excavationSites from "../excavationSites.js";
import type * as fileStorage from "../fileStorage.js";
import type * as gameEngine from "../gameEngine.js";
import type * as gameSessions from "../gameSessions.js";
import type * as progressTracking from "../progressTracking.js";
import type * as seedArtifacts from "../seedArtifacts.js";
import type * as seedDatabase from "../seedDatabase.js";
import type * as seedExcavationSites from "../seedExcavationSites.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminAnalytics: typeof adminAnalytics;
  adminArtifacts: typeof adminArtifacts;
  adminAuth: typeof adminAuth;
  adminChallenges: typeof adminChallenges;
  adminExcavationSites: typeof adminExcavationSites;
  adminUsers: typeof adminUsers;
  artifactGame: typeof artifactGame;
  artifacts: typeof artifacts;
  challenges: typeof challenges;
  excavationGame: typeof excavationGame;
  excavationSites: typeof excavationSites;
  fileStorage: typeof fileStorage;
  gameEngine: typeof gameEngine;
  gameSessions: typeof gameSessions;
  progressTracking: typeof progressTracking;
  seedArtifacts: typeof seedArtifacts;
  seedDatabase: typeof seedDatabase;
  seedExcavationSites: typeof seedExcavationSites;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
