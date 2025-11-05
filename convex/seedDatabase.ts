import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Initialize the database with all necessary seed data
 * This function should be called once to set up the initial data
 */
export const initializeDatabase = mutation({
  args: {},
  returns: v.object({
    artifactsCreated: v.number(),
    sitesCreated: v.number(),
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, _args) => {
    try {
      console.log("Starting database initialization...");

      // First, seed artifacts
      console.log("Seeding artifacts...");
      const artifactIds: string[] = await ctx.runMutation(
        api.seedArtifacts.seedArtifacts,
        {}
      );
      console.log(`Created ${artifactIds.length} artifacts`);

      // Then, seed excavation sites (depends on artifacts)
      console.log("Seeding excavation sites...");
      const siteIds: string[] = await ctx.runMutation(
        api.seedExcavationSites.seedExcavationSites,
        {}
      );
      console.log(`Created ${siteIds.length} excavation sites`);

      return {
        artifactsCreated: artifactIds.length,
        sitesCreated: siteIds.length,
        success: true,
        message: `Successfully initialized database with ${artifactIds.length} artifacts and ${siteIds.length} excavation sites`,
      };
    } catch (error) {
      console.error("Database initialization failed:", error);
      return {
        artifactsCreated: 0,
        sitesCreated: 0,
        success: false,
        message: `Database initialization failed: ${error}`,
      };
    }
  },
});

/**
 * Check if the database has been initialized
 */
export const checkDatabaseStatus = query({
  args: {},
  returns: v.object({
    artifactsCount: v.number(),
    sitesCount: v.number(),
    isInitialized: v.boolean(),
  }),
  handler: async (ctx, _args) => {
    const artifacts = await ctx.db.query("gameArtifacts").collect();
    const sites = await ctx.db.query("excavationSites").collect();

    return {
      artifactsCount: artifacts.length,
      sitesCount: sites.length,
      isInitialized: artifacts.length > 0 && sites.length > 0,
    };
  },
});
