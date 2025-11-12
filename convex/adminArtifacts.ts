import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { validateAdminRole } from "./adminAuth";

/**
 * Admin function to create a new artifact with validation
 */
export const createArtifact = mutation({
  args: {
    adminClerkId: v.string(),
    name: v.string(),
    description: v.string(),
    historicalPeriod: v.string(),
    culture: v.string(),
    dateRange: v.string(),
    significance: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    modelUrl: v.optional(v.string()),
    discoveryLocation: v.string(),
    conservationNotes: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    category: v.string(),
  },
  returns: v.id("gameArtifacts"),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    // Input validation
    if (!args.name.trim()) {
      throw new Error("Artifact name is required");
    }
    if (!args.description.trim()) {
      throw new Error("Artifact description is required");
    }
    if (!args.historicalPeriod.trim()) {
      throw new Error("Historical period is required");
    }
    if (!args.culture.trim()) {
      throw new Error("Culture is required");
    }
    if (!args.significance.trim()) {
      throw new Error("Significance is required");
    }
    if (!args.imageUrl && !args.imageStorageId) {
      throw new Error("Either image URL or uploaded image is required");
    }
    if (!args.discoveryLocation.trim()) {
      throw new Error("Discovery location is required");
    }
    if (!args.category.trim()) {
      throw new Error("Category is required");
    }

    // Handle image storage
    let finalImageUrl = args.imageUrl || "";
    if (args.imageStorageId) {
      const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
      if (!imageUrl) {
        throw new Error("Failed to get image URL from storage");
      }
      finalImageUrl = imageUrl;
    }

    // Create the artifact
    const artifactId = await ctx.db.insert("gameArtifacts", {
      name: args.name.trim(),
      description: args.description.trim(),
      historicalPeriod: args.historicalPeriod.trim(),
      culture: args.culture.trim(),
      dateRange: args.dateRange.trim(),
      significance: args.significance.trim(),
      imageUrl: finalImageUrl,
      imageStorageId: args.imageStorageId,
      modelUrl: args.modelUrl?.trim(),
      discoveryLocation: args.discoveryLocation.trim(),
      conservationNotes: args.conservationNotes.trim(),
      difficulty: args.difficulty,
      category: args.category.trim(),
      isActive: true,
    });

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "create_artifact",
      resourceType: "gameArtifacts",
      resourceId: artifactId as string,
      details: `Created artifact: ${args.name}`,
    });

    return artifactId;
  },
});

/**
 * Admin function to update an existing artifact
 */
export const updateArtifact = mutation({
  args: {
    adminClerkId: v.string(),
    artifactId: v.id("gameArtifacts"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    historicalPeriod: v.optional(v.string()),
    culture: v.optional(v.string()),
    dateRange: v.optional(v.string()),
    significance: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    modelUrl: v.optional(v.string()),
    discoveryLocation: v.optional(v.string()),
    conservationNotes: v.optional(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    const { adminClerkId, artifactId, ...updates } = args;

    // Check if artifact exists
    const existingArtifact = await ctx.db.get(artifactId);
    if (!existingArtifact) {
      throw new Error("Artifact not found");
    }

    // Handle image storage update
    if (updates.imageStorageId) {
      const imageUrl = await ctx.storage.getUrl(updates.imageStorageId);
      if (!imageUrl) {
        throw new Error("Failed to get image URL from storage");
      }
      updates.imageUrl = imageUrl;
    }

    // Validate non-empty strings for required fields
    const cleanUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (typeof value === "string" && key !== "modelUrl") {
          if (!value.trim()) {
            throw new Error(`${key} cannot be empty`);
          }
          cleanUpdates[key] = value.trim();
        } else {
          cleanUpdates[key] = value;
        }
      }
    }

    // Apply updates if any
    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(artifactId, cleanUpdates);
    }

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId,
      action: "update_artifact",
      resourceType: "gameArtifacts",
      resourceId: artifactId as string,
      details: `Updated artifact: ${existingArtifact.name}`,
    });

    return null;
  },
});

/**
 * Admin function to delete an artifact (soft delete)
 */
export const deleteArtifact = mutation({
  args: {
    adminClerkId: v.string(),
    artifactId: v.id("gameArtifacts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    // Check if artifact exists
    const existingArtifact = await ctx.db.get(args.artifactId);
    if (!existingArtifact) {
      throw new Error("Artifact not found");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.artifactId, { isActive: false });

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "delete_artifact",
      resourceType: "gameArtifacts",
      resourceId: args.artifactId as string,
      details: `Deleted artifact: ${existingArtifact.name}`,
    });

    return null;
  },
});

/**
 * Admin query to list all artifacts (including inactive ones)
 */
export const getAllArtifactsForAdmin = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("gameArtifacts"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      historicalPeriod: v.string(),
      culture: v.string(),
      dateRange: v.string(),
      significance: v.string(),
      imageUrl: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
      modelUrl: v.optional(v.string()),
      discoveryLocation: v.string(),
      conservationNotes: v.string(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      category: v.string(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // Admin validation is handled at the middleware level
    let query = ctx.db.query("gameArtifacts");

    if (!args.includeInactive) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    return await query.collect();
  },
});

/**
 * Admin query to get a specific artifact by ID
 */
export const getArtifactForAdmin = query({
  args: {
    artifactId: v.id("gameArtifacts"),
  },
  returns: v.union(
    v.object({
      _id: v.id("gameArtifacts"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      historicalPeriod: v.string(),
      culture: v.string(),
      dateRange: v.string(),
      significance: v.string(),
      imageUrl: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
      modelUrl: v.optional(v.string()),
      discoveryLocation: v.string(),
      conservationNotes: v.string(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      category: v.string(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Admin validation is handled at the middleware level
    return await ctx.db.get(args.artifactId);
  },
});

/**
 * Admin query to get artifact statistics
 */
export const getArtifactStats = query({
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
    byCategory: v.array(
      v.object({
        category: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    // TODO: Add admin role validation when auth system is complete

    const allArtifacts = await ctx.db.query("gameArtifacts").collect();

    const stats = {
      total: allArtifacts.length,
      active: allArtifacts.filter((a) => a.isActive).length,
      inactive: allArtifacts.filter((a) => !a.isActive).length,
      byDifficulty: {
        beginner: allArtifacts.filter(
          (a) => a.difficulty === "beginner" && a.isActive
        ).length,
        intermediate: allArtifacts.filter(
          (a) => a.difficulty === "intermediate" && a.isActive
        ).length,
        advanced: allArtifacts.filter(
          (a) => a.difficulty === "advanced" && a.isActive
        ).length,
      },
      byCategory: [] as Array<{ category: string; count: number }>,
    };

    // Calculate category statistics
    const categoryMap = new Map<string, number>();
    allArtifacts
      .filter((a) => a.isActive)
      .forEach((artifact) => {
        const count = categoryMap.get(artifact.category) || 0;
        categoryMap.set(artifact.category, count + 1);
      });

    stats.byCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return stats;
  },
});
