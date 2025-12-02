import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateAdminRole } from "./adminAuth";
import { api } from "./_generated/api";

// Validators for excavation site data structures
const environmentalConditionsValidator = v.object({
  visibility: v.number(), // 0-100 percentage
  currentStrength: v.number(), // 0-10 scale
  temperature: v.number(), // in Celsius
  depth: v.number(), // in meters
  sedimentType: v.string(),
  timeConstraints: v.number(), // in minutes
});

const siteArtifactValidator = v.object({
  artifactId: v.id("gameArtifacts"),
  gridPosition: v.object({
    x: v.number(),
    y: v.number(),
  }),
  depth: v.number(), // depth in grid cell (0-1, where 1 is fully buried)
  isDiscovered: v.boolean(),
  condition: v.union(
    v.literal("excellent"),
    v.literal("good"),
    v.literal("fair"),
    v.literal("poor")
  ),
});

/**
 * Admin function to create a new excavation site
 */
export const createExcavationSite = mutation({
  args: {
    adminClerkId: v.string(),
    name: v.string(),
    location: v.string(),
    historicalPeriod: v.string(),
    description: v.string(),
    gridWidth: v.number(),
    gridHeight: v.number(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    environmentalConditions: environmentalConditionsValidator,
    siteArtifacts: v.array(siteArtifactValidator),
  },
  returns: v.id("excavationSites"),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    // Input validation
    if (!args.name.trim()) {
      throw new Error("Site name is required");
    }
    if (!args.location.trim()) {
      throw new Error("Site location is required");
    }
    if (!args.historicalPeriod.trim()) {
      throw new Error("Historical period is required");
    }
    if (!args.description.trim()) {
      throw new Error("Site description is required");
    }

    // Validate grid dimensions
    if (args.gridWidth < 3 || args.gridWidth > 20) {
      throw new Error("Grid width must be between 3 and 20");
    }
    if (args.gridHeight < 3 || args.gridHeight > 20) {
      throw new Error("Grid height must be between 3 and 20");
    }

    // Validate environmental conditions
    if (
      args.environmentalConditions.visibility < 0 ||
      args.environmentalConditions.visibility > 100
    ) {
      throw new Error("Visibility must be between 0 and 100");
    }
    if (
      args.environmentalConditions.currentStrength < 0 ||
      args.environmentalConditions.currentStrength > 10
    ) {
      throw new Error("Current strength must be between 0 and 10");
    }
    if (args.environmentalConditions.timeConstraints <= 0) {
      throw new Error("Time constraints must be positive");
    }

    // Validate artifact positions are within grid bounds
    for (const artifact of args.siteArtifacts) {
      if (
        artifact.gridPosition.x < 0 ||
        artifact.gridPosition.x >= args.gridWidth
      ) {
        throw new Error(
          `Artifact position x (${artifact.gridPosition.x}) is outside grid bounds`
        );
      }
      if (
        artifact.gridPosition.y < 0 ||
        artifact.gridPosition.y >= args.gridHeight
      ) {
        throw new Error(
          `Artifact position y (${artifact.gridPosition.y}) is outside grid bounds`
        );
      }
      if (artifact.depth < 0 || artifact.depth > 1) {
        throw new Error("Artifact depth must be between 0 and 1");
      }
    }

    // Verify all referenced artifacts exist and are active
    for (const artifact of args.siteArtifacts) {
      const gameArtifact = await ctx.db.get(artifact.artifactId);
      if (!gameArtifact || !gameArtifact.isActive) {
        throw new Error(
          `Referenced artifact ${artifact.artifactId} does not exist or is inactive`
        );
      }
    }

    // Check for duplicate positions
    const positions = new Set<string>();
    for (const artifact of args.siteArtifacts) {
      const posKey = `${artifact.gridPosition.x},${artifact.gridPosition.y}`;
      if (positions.has(posKey)) {
        throw new Error(
          `Multiple artifacts cannot occupy the same grid position (${artifact.gridPosition.x}, ${artifact.gridPosition.y})`
        );
      }
      positions.add(posKey);
    }

    // Create the excavation site
    const siteId = await ctx.db.insert("excavationSites", {
      name: args.name.trim(),
      location: args.location.trim(),
      historicalPeriod: args.historicalPeriod.trim(),
      description: args.description.trim(),
      gridWidth: args.gridWidth,
      gridHeight: args.gridHeight,
      difficulty: args.difficulty,
      environmentalConditions: JSON.stringify(args.environmentalConditions),
      siteArtifacts: args.siteArtifacts.map((artifact) =>
        JSON.stringify(artifact)
      ),
      isActive: true,
    });

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "create_excavation_site",
      resourceType: "excavationSites",
      resourceId: siteId as string,
      details: `Created excavation site: ${args.name}`,
    });

    return siteId;
  },
});

/**
 * Admin function to update an existing excavation site
 */
export const updateExcavationSite = mutation({
  args: {
    adminClerkId: v.string(),
    siteId: v.id("excavationSites"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    historicalPeriod: v.optional(v.string()),
    description: v.optional(v.string()),
    gridWidth: v.optional(v.number()),
    gridHeight: v.optional(v.number()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    environmentalConditions: v.optional(environmentalConditionsValidator),
    siteArtifacts: v.optional(v.array(siteArtifactValidator)),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    const { adminClerkId, siteId, ...updates } = args;

    // Check if site exists
    const existingSite = await ctx.db.get(siteId);
    if (!existingSite) {
      throw new Error("Excavation site not found");
    }

    // Validate updates
    const cleanUpdates: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (typeof value === "string") {
          if (!value.trim()) {
            throw new Error(`${key} cannot be empty`);
          }
          cleanUpdates[key] = value.trim();
        } else if (key === "gridWidth" || key === "gridHeight") {
          if (typeof value === "number" && (value < 3 || value > 20)) {
            throw new Error(`${key} must be between 3 and 20`);
          }
          cleanUpdates[key] = value;
        } else if (key === "environmentalConditions") {
          // Validate environmental conditions
          const conditions = value as any;
          if (conditions.visibility < 0 || conditions.visibility > 100) {
            throw new Error("Visibility must be between 0 and 100");
          }
          if (
            conditions.currentStrength < 0 ||
            conditions.currentStrength > 10
          ) {
            throw new Error("Current strength must be between 0 and 10");
          }
          if (conditions.timeConstraints <= 0) {
            throw new Error("Time constraints must be positive");
          }
          cleanUpdates[key] = JSON.stringify(conditions);
        } else if (key === "siteArtifacts") {
          const artifacts = value as any[];
          const gridWidth = cleanUpdates.gridWidth || existingSite.gridWidth;
          const gridHeight = cleanUpdates.gridHeight || existingSite.gridHeight;

          // Validate artifact positions
          const positions = new Set<string>();
          for (const artifact of artifacts) {
            if (
              artifact.gridPosition.x < 0 ||
              artifact.gridPosition.x >= gridWidth
            ) {
              throw new Error(
                `Artifact position x (${artifact.gridPosition.x}) is outside grid bounds`
              );
            }
            if (
              artifact.gridPosition.y < 0 ||
              artifact.gridPosition.y >= gridHeight
            ) {
              throw new Error(
                `Artifact position y (${artifact.gridPosition.y}) is outside grid bounds`
              );
            }
            if (artifact.depth < 0 || artifact.depth > 1) {
              throw new Error("Artifact depth must be between 0 and 1");
            }

            const posKey = `${artifact.gridPosition.x},${artifact.gridPosition.y}`;
            if (positions.has(posKey)) {
              throw new Error(
                `Multiple artifacts cannot occupy the same grid position (${artifact.gridPosition.x}, ${artifact.gridPosition.y})`
              );
            }
            positions.add(posKey);

            // Verify artifact exists and is active
            const gameArtifact = await ctx.db.get(artifact.artifactId);
            if (!gameArtifact || (gameArtifact as any).isActive === false) {
              throw new Error(
                `Referenced artifact ${artifact.artifactId} does not exist or is inactive`
              );
            }
          }

          cleanUpdates[key] = artifacts.map((artifact) =>
            JSON.stringify(artifact)
          );
        } else {
          cleanUpdates[key] = value;
        }
      }
    }

    // Apply updates if any
    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(siteId, cleanUpdates);
    }

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId,
      action: "update_excavation_site",
      resourceType: "excavationSites",
      resourceId: siteId as string,
      details: `Updated excavation site: ${existingSite.name}`,
    });

    return null;
  },
});

/**
 * Admin function to delete an excavation site (soft delete)
 */
export const deleteExcavationSite = mutation({
  args: {
    adminClerkId: v.string(),
    siteId: v.id("excavationSites"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    // Check if site exists
    const existingSite = await ctx.db.get(args.siteId);
    if (!existingSite) {
      throw new Error("Excavation site not found");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.siteId, { isActive: false });

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "delete_excavation_site",
      resourceType: "excavationSites",
      resourceId: args.siteId as string,
      details: `Deleted excavation site: ${existingSite.name}`,
    });

    return null;
  },
});

/**
 * Admin query to list all excavation sites (including inactive ones)
 */
export const getAllExcavationSitesForAdmin = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("excavationSites"),
      _creationTime: v.number(),
      name: v.string(),
      location: v.string(),
      historicalPeriod: v.string(),
      description: v.string(),
      gridWidth: v.number(),
      gridHeight: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      environmentalConditions: environmentalConditionsValidator,
      siteArtifacts: v.array(siteArtifactValidator),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // Note: This is a query function, admin validation is handled at the API layer

    let query = ctx.db.query("excavationSites");

    if (!args.includeInactive) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const sites = await query.collect();

    return sites.map((site) => ({
      ...site,
      environmentalConditions: JSON.parse(site.environmentalConditions),
      siteArtifacts: site.siteArtifacts.map((artifact) => JSON.parse(artifact)),
    }));
  },
});

/**
 * Admin query to get a specific excavation site by ID
 */
export const getExcavationSiteForAdmin = query({
  args: {
    siteId: v.id("excavationSites"),
  },
  returns: v.union(
    v.object({
      _id: v.id("excavationSites"),
      _creationTime: v.number(),
      name: v.string(),
      location: v.string(),
      historicalPeriod: v.string(),
      description: v.string(),
      gridWidth: v.number(),
      gridHeight: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      environmentalConditions: environmentalConditionsValidator,
      siteArtifacts: v.array(siteArtifactValidator),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const site = await ctx.db.get(args.siteId);
    if (!site) {
      return null;
    }

    return {
      ...site,
      environmentalConditions: JSON.parse(site.environmentalConditions),
      siteArtifacts: site.siteArtifacts.map((artifact) => JSON.parse(artifact)),
    };
  },
});

/**
 * Admin function to add artifacts to an excavation site
 */
export const addArtifactsToSite = mutation({
  args: {
    adminClerkId: v.string(),
    siteId: v.id("excavationSites"),
    artifacts: v.array(siteArtifactValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Excavation site not found");
    }

    const existingArtifacts = site.siteArtifacts.map((artifact) =>
      JSON.parse(artifact)
    );
    const existingPositions = new Set(
      existingArtifacts.map((a) => `${a.gridPosition.x},${a.gridPosition.y}`)
    );

    // Validate new artifacts
    for (const artifact of args.artifacts) {
      // Check grid bounds
      if (
        artifact.gridPosition.x < 0 ||
        artifact.gridPosition.x >= site.gridWidth ||
        artifact.gridPosition.y < 0 ||
        artifact.gridPosition.y >= site.gridHeight
      ) {
        throw new Error(
          `Artifact position (${artifact.gridPosition.x}, ${artifact.gridPosition.y}) is outside grid bounds`
        );
      }

      // Check for position conflicts
      const posKey = `${artifact.gridPosition.x},${artifact.gridPosition.y}`;
      if (existingPositions.has(posKey)) {
        throw new Error(
          `Position (${artifact.gridPosition.x}, ${artifact.gridPosition.y}) is already occupied`
        );
      }
      existingPositions.add(posKey);

      // Verify artifact exists and is active
      const gameArtifact = await ctx.db.get(artifact.artifactId);
      if (!gameArtifact || !gameArtifact.isActive) {
        throw new Error(
          `Referenced artifact ${artifact.artifactId} does not exist or is inactive`
        );
      }
    }

    // Add new artifacts to existing ones
    const updatedArtifacts = [...existingArtifacts, ...args.artifacts];

    await ctx.db.patch(args.siteId, {
      siteArtifacts: updatedArtifacts.map((artifact) =>
        JSON.stringify(artifact)
      ),
    });

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "add_artifacts_to_site",
      resourceType: "excavationSites",
      resourceId: args.siteId as string,
      details: `Added ${args.artifacts.length} artifacts to site: ${site.name}`,
    });

    return null;
  },
});

/**
 * Admin function to bulk import excavation sites from JSON
 */
export const bulkImportSites = mutation({
  args: {
    items: v.array(
      v.object({
        name: v.string(),
        location: v.string(),
        historicalPeriod: v.string(),
        description: v.string(),
        gridWidth: v.number(),
        gridHeight: v.number(),
        difficulty: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced")
        ),
        environmentalConditions: environmentalConditionsValidator,
        siteArtifacts: v.array(siteArtifactValidator),
      })
    ),
  },
  returns: v.object({
    successCount: v.number(),
    failedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      try {
        // Validate required fields
        if (!item.name?.trim()) {
          throw new Error("Name is required");
        }
        if (!item.location?.trim()) {
          throw new Error("Location is required");
        }
        if (item.gridWidth < 3 || item.gridWidth > 20) {
          throw new Error("Grid width must be between 3 and 20");
        }
        if (item.gridHeight < 3 || item.gridHeight > 20) {
          throw new Error("Grid height must be between 3 and 20");
        }

        // Validate artifact positions
        for (const artifact of item.siteArtifacts) {
          if (
            artifact.gridPosition.x < 0 ||
            artifact.gridPosition.x >= item.gridWidth ||
            artifact.gridPosition.y < 0 ||
            artifact.gridPosition.y >= item.gridHeight
          ) {
            throw new Error(
              `Artifact position (${artifact.gridPosition.x}, ${artifact.gridPosition.y}) is outside grid bounds`
            );
          }

          // Verify artifact exists
          const gameArtifact = await ctx.db.get(artifact.artifactId);
          if (!gameArtifact || !gameArtifact.isActive) {
            throw new Error(
              `Referenced artifact ${artifact.artifactId} does not exist or is inactive`
            );
          }
        }

        await ctx.db.insert("excavationSites", {
          name: item.name.trim(),
          location: item.location.trim(),
          historicalPeriod: item.historicalPeriod.trim(),
          description: item.description.trim(),
          gridWidth: item.gridWidth,
          gridHeight: item.gridHeight,
          difficulty: item.difficulty,
          environmentalConditions: JSON.stringify(item.environmentalConditions),
          siteArtifacts: item.siteArtifacts.map((artifact) =>
            JSON.stringify(artifact)
          ),
          isActive: true,
        });

        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push(
          `Item ${i + 1} (${item.name || "unnamed"}): ${error.message}`
        );
      }
    }

    return {
      successCount,
      failedCount,
      errors,
    };
  },
});

/**
 * Admin query to get excavation site statistics
 */
export const getExcavationSiteStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    active: v.number(),
    inactive: v.number(),
    byDifficulty: v.object({
      beginner: v.number(),
      intermediate: v.number(),
      advanced: v.number(),
    }),
    averageArtifactsPerSite: v.number(),
    totalArtifactsPlaced: v.number(),
  }),
  handler: async (ctx) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const allSites = await ctx.db.query("excavationSites").collect();

    const stats = {
      total: allSites.length,
      active: allSites.filter((s) => s.isActive).length,
      inactive: allSites.filter((s) => !s.isActive).length,
      byDifficulty: {
        beginner: allSites.filter(
          (s) => s.difficulty === "beginner" && s.isActive
        ).length,
        intermediate: allSites.filter(
          (s) => s.difficulty === "intermediate" && s.isActive
        ).length,
        advanced: allSites.filter(
          (s) => s.difficulty === "advanced" && s.isActive
        ).length,
      },
      averageArtifactsPerSite: 0,
      totalArtifactsPlaced: 0,
    };

    // Calculate artifact statistics
    const activeSites = allSites.filter((s) => s.isActive);
    if (activeSites.length > 0) {
      const totalArtifacts = activeSites.reduce((sum, site) => {
        return sum + site.siteArtifacts.length;
      }, 0);

      stats.totalArtifactsPlaced = totalArtifacts;
      stats.averageArtifactsPerSite =
        Math.round((totalArtifacts / activeSites.length) * 10) / 10;
    }

    return stats;
  },
});
