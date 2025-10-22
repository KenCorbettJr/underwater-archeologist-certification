import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new artifact
export const createArtifact = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    historicalPeriod: v.string(),
    culture: v.string(),
    dateRange: v.string(),
    significance: v.string(),
    imageUrl: v.string(),
    modelUrl: v.optional(v.string()),
    discoveryLocation: v.string(),
    conservationNotes: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    category: v.string(),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("gameArtifacts"),
  handler: async (ctx, args) => {
    const artifactId = await ctx.db.insert("gameArtifacts", {
      ...args,
      isActive: args.isActive ?? true,
    });
    return artifactId;
  },
});

// Get artifact by ID
export const getArtifact = query({
  args: { artifactId: v.id("gameArtifacts") },
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
    return await ctx.db.get(args.artifactId);
  },
});

// Get all active artifacts
export const getAllArtifacts = query({
  args: {},
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
  handler: async (ctx) => {
    return await ctx.db
      .query("gameArtifacts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get artifacts by difficulty level
export const getArtifactsByDifficulty = query({
  args: {
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
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
    return await ctx.db
      .query("gameArtifacts")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get artifacts by category
export const getArtifactsByCategory = query({
  args: { category: v.string() },
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
    return await ctx.db
      .query("gameArtifacts")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get artifacts by historical period
export const getArtifactsByPeriod = query({
  args: { historicalPeriod: v.string() },
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
    return await ctx.db
      .query("gameArtifacts")
      .withIndex("by_historical_period", (q) =>
        q.eq("historicalPeriod", args.historicalPeriod)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get artifacts by culture
export const getArtifactsByCulture = query({
  args: { culture: v.string() },
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
    return await ctx.db
      .query("gameArtifacts")
      .withIndex("by_culture", (q) => q.eq("culture", args.culture))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Update artifact
export const updateArtifact = mutation({
  args: {
    artifactId: v.id("gameArtifacts"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    historicalPeriod: v.optional(v.string()),
    culture: v.optional(v.string()),
    dateRange: v.optional(v.string()),
    significance: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
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
    const { artifactId, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(artifactId, cleanUpdates);
    }

    return null;
  },
});

// Delete artifact (soft delete by setting isActive to false)
export const deleteArtifact = mutation({
  args: { artifactId: v.id("gameArtifacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.artifactId, { isActive: false });
    return null;
  },
});

// Get unique categories
export const getArtifactCategories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const artifacts = await ctx.db
      .query("gameArtifacts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = new Set(artifacts.map((artifact) => artifact.category));
    return Array.from(categories).sort();
  },
});

// Get unique historical periods
export const getHistoricalPeriods = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const artifacts = await ctx.db
      .query("gameArtifacts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const periods = new Set(
      artifacts.map((artifact) => artifact.historicalPeriod)
    );
    return Array.from(periods).sort();
  },
});

// Get unique cultures
export const getCultures = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const artifacts = await ctx.db
      .query("gameArtifacts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const cultures = new Set(artifacts.map((artifact) => artifact.culture));
    return Array.from(cultures).sort();
  },
});

// Get random artifacts for game challenges
export const getRandomArtifacts = query({
  args: {
    count: v.number(),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    excludeIds: v.optional(v.array(v.id("gameArtifacts"))),
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
    let artifacts;

    if (args.difficulty) {
      artifacts = await ctx.db
        .query("gameArtifacts")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      artifacts = await ctx.db
        .query("gameArtifacts")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Filter out excluded IDs
    if (args.excludeIds && args.excludeIds.length > 0) {
      artifacts = artifacts.filter(
        (artifact) => !args.excludeIds!.includes(artifact._id)
      );
    }

    // Shuffle and take requested count
    const shuffled = artifacts.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(args.count, shuffled.length));
  },
});
