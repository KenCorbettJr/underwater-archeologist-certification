import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateAdminRole } from "./adminAuth";
import { api } from "./_generated/api";

/**
 * Admin function to create a new challenge
 */
export const createChallenge = mutation({
  args: {
    adminClerkId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("artifacts"),
      v.literal("techniques"),
      v.literal("history"),
      v.literal("conservation"),
      v.literal("fieldwork")
    ),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    points: v.number(),
    content: v.string(),
    requiredLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    order: v.number(),
  },
  returns: v.id("challenges"),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    // Input validation
    if (!args.title.trim()) {
      throw new Error("Challenge title is required");
    }
    if (!args.description.trim()) {
      throw new Error("Challenge description is required");
    }
    if (!args.content.trim()) {
      throw new Error("Challenge content is required");
    }
    if (args.points <= 0) {
      throw new Error("Points must be positive");
    }
    if (args.order < 0) {
      throw new Error("Order must be non-negative");
    }

    // Validate difficulty and required level consistency
    const difficultyLevels = ["beginner", "intermediate", "advanced"];
    const difficultyIndex = difficultyLevels.indexOf(args.difficulty);
    const requiredLevelIndex = difficultyLevels.indexOf(args.requiredLevel);

    if (requiredLevelIndex > difficultyIndex) {
      throw new Error(
        "Required level cannot be higher than challenge difficulty"
      );
    }

    // Check if order already exists for this category and difficulty
    const existingChallenge = await ctx.db
      .query("challenges")
      .withIndex("by_difficulty_and_order", (q) =>
        q.eq("difficulty", args.difficulty).eq("order", args.order)
      )
      .filter((q) => q.eq(q.field("category"), args.category))
      .first();

    if (existingChallenge) {
      throw new Error(
        `A challenge with order ${args.order} already exists for ${args.category} at ${args.difficulty} difficulty`
      );
    }

    // Create the challenge
    const challengeId = await ctx.db.insert("challenges", {
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      difficulty: args.difficulty,
      points: args.points,
      content: args.content.trim(),
      requiredLevel: args.requiredLevel,
      isActive: true,
      order: args.order,
    });

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "create_challenge",
      resourceType: "challenges",
      resourceId: challengeId,
      details: `Created challenge: ${args.title}`,
    });

    return challengeId;
  },
});

/**
 * Admin function to update an existing challenge
 */
export const updateChallenge = mutation({
  args: {
    adminClerkId: v.string(),
    challengeId: v.id("challenges"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("artifacts"),
        v.literal("techniques"),
        v.literal("history"),
        v.literal("conservation"),
        v.literal("fieldwork")
      )
    ),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    points: v.optional(v.number()),
    content: v.optional(v.string()),
    requiredLevel: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    const { adminClerkId, challengeId, ...updates } = args;

    // Check if challenge exists
    const existingChallenge = await ctx.db.get(challengeId);
    if (!existingChallenge) {
      throw new Error("Challenge not found");
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
        } else if (key === "points") {
          if (typeof value === "number" && value <= 0) {
            throw new Error("Points must be positive");
          }
          cleanUpdates[key] = value;
        } else if (key === "order") {
          if (typeof value === "number" && value < 0) {
            throw new Error("Order must be non-negative");
          }

          // Check if new order conflicts with existing challenges
          const category = cleanUpdates.category || existingChallenge.category;
          const difficulty =
            cleanUpdates.difficulty || existingChallenge.difficulty;

          const conflictingChallenge = await ctx.db
            .query("challenges")
            .withIndex("by_difficulty_and_order", (q) =>
              q.eq("difficulty", difficulty).eq("order", value as number)
            )
            .filter(
              (q) =>
                q.eq(q.field("category"), category) &&
                q.neq(q.field("_id"), challengeId)
            )
            .first();

          if (conflictingChallenge) {
            throw new Error(
              `A challenge with order ${value} already exists for ${category} at ${difficulty} difficulty`
            );
          }

          cleanUpdates[key] = value;
        } else {
          cleanUpdates[key] = value;
        }
      }
    }

    // Validate difficulty and required level consistency if both are being updated
    if (cleanUpdates.difficulty || cleanUpdates.requiredLevel) {
      const difficulty =
        cleanUpdates.difficulty || existingChallenge.difficulty;
      const requiredLevel =
        cleanUpdates.requiredLevel || existingChallenge.requiredLevel;

      const difficultyLevels = ["beginner", "intermediate", "advanced"];
      const difficultyIndex = difficultyLevels.indexOf(difficulty);
      const requiredLevelIndex = difficultyLevels.indexOf(requiredLevel);

      if (requiredLevelIndex > difficultyIndex) {
        throw new Error(
          "Required level cannot be higher than challenge difficulty"
        );
      }
    }

    // Apply updates if any
    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(challengeId, cleanUpdates);
    }

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId,
      action: "update_challenge",
      resourceType: "challenges",
      resourceId: challengeId,
      details: `Updated challenge: ${existingChallenge.title}`,
    });

    return null;
  },
});

/**
 * Admin function to delete a challenge (soft delete)
 */
export const deleteChallenge = mutation({
  args: {
    adminClerkId: v.string(),
    challengeId: v.id("challenges"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    // Check if challenge exists
    const existingChallenge = await ctx.db.get(args.challengeId);
    if (!existingChallenge) {
      throw new Error("Challenge not found");
    }

    // Check if challenge is being used by any users
    const userProgress = await ctx.db
      .query("userProgress")
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .first();

    if (userProgress) {
      // Don't actually delete if users have progress, just deactivate
      await ctx.db.patch(args.challengeId, { isActive: false });
    } else {
      // Safe to deactivate since no user progress exists
      await ctx.db.patch(args.challengeId, { isActive: false });
    }

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "delete_challenge",
      resourceType: "challenges",
      resourceId: args.challengeId,
      details: `Deleted challenge: ${existingChallenge.title}`,
    });

    return null;
  },
});

/**
 * Admin query to list all challenges (including inactive ones)
 */
export const getAllChallengesForAdmin = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    category: v.optional(
      v.union(
        v.literal("artifacts"),
        v.literal("techniques"),
        v.literal("history"),
        v.literal("conservation"),
        v.literal("fieldwork")
      )
    ),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("challenges"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      category: v.union(
        v.literal("artifacts"),
        v.literal("techniques"),
        v.literal("history"),
        v.literal("conservation"),
        v.literal("fieldwork")
      ),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      points: v.number(),
      content: v.string(),
      requiredLevel: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      isActive: v.boolean(),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Note: This is a query function, admin validation is handled at the API layer

    let challenges;

    // Apply filters
    if (args.category && args.difficulty) {
      challenges = await ctx.db
        .query("challenges")
        .withIndex("by_category_and_difficulty", (q) =>
          q.eq("category", args.category!).eq("difficulty", args.difficulty!)
        )
        .collect();
    } else if (args.difficulty) {
      challenges = await ctx.db
        .query("challenges")
        .withIndex("by_difficulty_and_order", (q) =>
          q.eq("difficulty", args.difficulty!)
        )
        .collect();
    } else {
      challenges = await ctx.db.query("challenges").collect();
    }

    // Apply additional filters
    if (args.category && !args.difficulty) {
      challenges = challenges.filter((c) => c.category === args.category);
    }

    if (!args.includeInactive) {
      challenges = challenges.filter((c) => c.isActive);
    }

    // Sort by category, difficulty, and order
    return challenges.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      if (a.difficulty !== b.difficulty) {
        const difficultyOrder = ["beginner", "intermediate", "advanced"];
        return (
          difficultyOrder.indexOf(a.difficulty) -
          difficultyOrder.indexOf(b.difficulty)
        );
      }
      return a.order - b.order;
    });
  },
});

/**
 * Admin query to get a specific challenge by ID
 */
export const getChallengeForAdmin = query({
  args: {
    challengeId: v.id("challenges"),
  },
  returns: v.union(
    v.object({
      _id: v.id("challenges"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      category: v.union(
        v.literal("artifacts"),
        v.literal("techniques"),
        v.literal("history"),
        v.literal("conservation"),
        v.literal("fieldwork")
      ),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      points: v.number(),
      content: v.string(),
      requiredLevel: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      isActive: v.boolean(),
      order: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Note: This is a query function, admin validation is handled at the API layer

    return await ctx.db.get(args.challengeId);
  },
});

/**
 * Admin function to reorder challenges within a category and difficulty
 */
export const reorderChallenges = mutation({
  args: {
    adminClerkId: v.string(),
    category: v.union(
      v.literal("artifacts"),
      v.literal("techniques"),
      v.literal("history"),
      v.literal("conservation"),
      v.literal("fieldwork")
    ),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    challengeOrders: v.array(
      v.object({
        challengeId: v.id("challenges"),
        newOrder: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    // Validate that all challenges exist and belong to the specified category/difficulty
    for (const { challengeId, newOrder } of args.challengeOrders) {
      const challenge = await ctx.db.get(challengeId);
      if (!challenge) {
        throw new Error(`Challenge ${challengeId} not found`);
      }
      if (
        challenge.category !== args.category ||
        challenge.difficulty !== args.difficulty
      ) {
        throw new Error(
          `Challenge ${challengeId} does not belong to category ${args.category} with difficulty ${args.difficulty}`
        );
      }
      if (newOrder < 0) {
        throw new Error("Order must be non-negative");
      }
    }

    // Check for duplicate orders
    const orders = args.challengeOrders.map((co) => co.newOrder);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error("Duplicate orders are not allowed");
    }

    // Update all challenge orders
    for (const { challengeId, newOrder } of args.challengeOrders) {
      await ctx.db.patch(challengeId, { order: newOrder });
    }

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "reorder_challenges",
      resourceType: "challenges",
      details: `Reordered ${args.challengeOrders.length} challenges in ${args.category} (${args.difficulty})`,
    });

    return null;
  },
});

/**
 * Admin query to get challenge statistics
 */
export const getChallengeStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    active: v.number(),
    inactive: v.number(),
    byCategory: v.object({
      artifacts: v.number(),
      techniques: v.number(),
      history: v.number(),
      conservation: v.number(),
      fieldwork: v.number(),
    }),
    byDifficulty: v.object({
      beginner: v.number(),
      intermediate: v.number(),
      advanced: v.number(),
    }),
    averagePoints: v.number(),
    totalUserProgress: v.number(),
  }),
  handler: async (ctx) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const allChallenges = await ctx.db.query("challenges").collect();
    const activeChallenges = allChallenges.filter((c) => c.isActive);

    const stats = {
      total: allChallenges.length,
      active: activeChallenges.length,
      inactive: allChallenges.length - activeChallenges.length,
      byCategory: {
        artifacts: activeChallenges.filter((c) => c.category === "artifacts")
          .length,
        techniques: activeChallenges.filter((c) => c.category === "techniques")
          .length,
        history: activeChallenges.filter((c) => c.category === "history")
          .length,
        conservation: activeChallenges.filter(
          (c) => c.category === "conservation"
        ).length,
        fieldwork: activeChallenges.filter((c) => c.category === "fieldwork")
          .length,
      },
      byDifficulty: {
        beginner: activeChallenges.filter((c) => c.difficulty === "beginner")
          .length,
        intermediate: activeChallenges.filter(
          (c) => c.difficulty === "intermediate"
        ).length,
        advanced: activeChallenges.filter((c) => c.difficulty === "advanced")
          .length,
      },
      averagePoints: 0,
      totalUserProgress: 0,
    };

    // Calculate average points
    if (activeChallenges.length > 0) {
      const totalPoints = activeChallenges.reduce(
        (sum, challenge) => sum + challenge.points,
        0
      );
      stats.averagePoints =
        Math.round((totalPoints / activeChallenges.length) * 10) / 10;
    }

    // Count total user progress entries
    const allUserProgress = await ctx.db.query("userProgress").collect();
    stats.totalUserProgress = allUserProgress.length;

    return stats;
  },
});
