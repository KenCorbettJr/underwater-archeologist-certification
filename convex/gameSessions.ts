import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Game session CRUD operations with auto-save and timeout handling

/**
 * Create a new game session for a user
 */
export const createGameSession = mutation({
  args: {
    userId: v.id("users"),
    gameType: v.union(
      v.literal("artifact_identification"),
      v.literal("excavation_simulation"),
      v.literal("site_documentation"),
      v.literal("historical_timeline"),
      v.literal("conservation_lab")
    ),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    maxScore: v.number(),
    initialGameData: v.optional(v.string()),
  },
  returns: v.id("gameSessions"),
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check for existing active session of the same game type
    const existingSession = await ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .filter((q) => q.eq(q.field("gameType"), args.gameType))
      .first();

    if (existingSession) {
      // Auto-abandon the existing session
      await ctx.db.patch(existingSession._id, {
        status: "abandoned",
        endTime: Date.now(),
      });
    }

    // Create new session
    const sessionId = await ctx.db.insert("gameSessions", {
      userId: args.userId,
      gameType: args.gameType,
      difficulty: args.difficulty,
      status: "active",
      startTime: Date.now(),
      currentScore: 0,
      maxScore: args.maxScore,
      completionPercentage: 0,
      gameData: args.initialGameData || "{}",
      actions: [],
    });

    return sessionId;
  },
});

/**
 * Get active game session for a user and game type
 */
export const getActiveGameSession = mutation({
  args: {
    userId: v.id("users"),
    gameType: v.union(
      v.literal("artifact_identification"),
      v.literal("excavation_simulation"),
      v.literal("site_documentation"),
      v.literal("historical_timeline"),
      v.literal("conservation_lab")
    ),
  },
  returns: v.union(
    v.object({
      _id: v.id("gameSessions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      gameType: v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      ),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      status: v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("abandoned")
      ),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      currentScore: v.number(),
      maxScore: v.number(),
      completionPercentage: v.number(),
      gameData: v.string(),
      actions: v.array(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .filter((q) => q.eq(q.field("gameType"), args.gameType))
      .first();

    if (!session) {
      return null;
    }

    // Check for session timeout (45 minutes)
    const SESSION_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes
    const currentTime = Date.now();
    const elapsedTime = currentTime - session.startTime;

    if (elapsedTime > SESSION_TIMEOUT_MS) {
      // Auto-abandon expired session
      await ctx.db.patch(session._id, {
        status: "abandoned",
        endTime: currentTime,
      });
      return null;
    }

    return session;
  },
});

/**
 * Update game session with auto-save functionality
 */
export const updateGameSession = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    updates: v.object({
      currentScore: v.optional(v.number()),
      completionPercentage: v.optional(v.number()),
      gameData: v.optional(v.string()),
      newAction: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Cannot update inactive game session");
    }

    // Check for session timeout
    const SESSION_TIMEOUT_MS = 45 * 60 * 1000;
    const currentTime = Date.now();
    const elapsedTime = currentTime - session.startTime;

    if (elapsedTime > SESSION_TIMEOUT_MS) {
      // Auto-abandon expired session
      await ctx.db.patch(args.sessionId, {
        status: "abandoned",
        endTime: currentTime,
      });
      throw new Error("Game session has expired");
    }

    // Prepare updates
    const updateData: any = {};

    if (args.updates.currentScore !== undefined) {
      // Validate score doesn't exceed max score
      if (args.updates.currentScore > session.maxScore) {
        throw new Error("Score cannot exceed maximum score");
      }
      updateData.currentScore = Math.max(0, args.updates.currentScore);
    }

    if (args.updates.completionPercentage !== undefined) {
      updateData.completionPercentage = Math.min(
        100,
        Math.max(0, args.updates.completionPercentage)
      );
    }

    if (args.updates.gameData !== undefined) {
      updateData.gameData = args.updates.gameData;
    }

    if (args.updates.newAction !== undefined) {
      // Add new action to the actions array
      updateData.actions = [...session.actions, args.updates.newAction];
    }

    await ctx.db.patch(args.sessionId, updateData);
    return null;
  },
});

/**
 * Complete a game session
 */
export const completeGameSession = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    finalScore: v.number(),
    finalGameData: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Cannot complete inactive game session");
    }

    // Validate final score
    if (args.finalScore > session.maxScore) {
      throw new Error("Final score cannot exceed maximum score");
    }

    const updateData: any = {
      status: "completed" as const,
      endTime: Date.now(),
      currentScore: Math.max(0, args.finalScore),
      completionPercentage: 100,
    };

    if (args.finalGameData !== undefined) {
      updateData.gameData = args.finalGameData;
    }

    await ctx.db.patch(args.sessionId, updateData);
    return null;
  },
});

/**
 * Abandon a game session
 */
export const abandonGameSession = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Cannot abandon inactive game session");
    }

    await ctx.db.patch(args.sessionId, {
      status: "abandoned",
      endTime: Date.now(),
    });

    return null;
  },
});

/**
 * Get game session history for a user
 */
export const getGameSessionHistory = query({
  args: {
    userId: v.id("users"),
    gameType: v.optional(
      v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      )
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("gameSessions"),
      _creationTime: v.number(),
      gameType: v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      ),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      status: v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("abandoned")
      ),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      currentScore: v.number(),
      maxScore: v.number(),
      completionPercentage: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId));

    if (args.gameType) {
      query = query.filter((q) => q.eq(q.field("gameType"), args.gameType));
    }

    const sessions = await query.order("desc").take(args.limit || 20);

    return sessions.map((session) => ({
      _id: session._id,
      _creationTime: session._creationTime,
      gameType: session.gameType,
      difficulty: session.difficulty,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      currentScore: session.currentScore,
      maxScore: session.maxScore,
      completionPercentage: session.completionPercentage,
    }));
  },
});

/**
 * Recover from session timeout - internal function for cleanup
 */
export const cleanupExpiredSessions = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx, args) => {
    const SESSION_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes
    const currentTime = Date.now();
    const cutoffTime = currentTime - SESSION_TIMEOUT_MS;

    // Find all active sessions that have expired
    const expiredSessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("startTime"), cutoffTime))
      .collect();

    // Abandon expired sessions
    let cleanedCount = 0;
    for (const session of expiredSessions) {
      await ctx.db.patch(session._id, {
        status: "abandoned",
        endTime: currentTime,
      });
      cleanedCount++;
    }

    return cleanedCount;
  },
});

/**
 * Get session statistics for analytics
 */
export const getSessionStatistics = query({
  args: {
    userId: v.id("users"),
    gameType: v.optional(
      v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      )
    ),
  },
  returns: v.object({
    totalSessions: v.number(),
    completedSessions: v.number(),
    abandonedSessions: v.number(),
    averageScore: v.number(),
    bestScore: v.number(),
    totalTimeSpent: v.number(), // in minutes
    averageSessionTime: v.number(), // in minutes
  }),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId));

    if (args.gameType) {
      query = query.filter((q) => q.eq(q.field("gameType"), args.gameType));
    }

    const sessions = await query.collect();

    const stats = {
      totalSessions: sessions.length,
      completedSessions: 0,
      abandonedSessions: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      averageSessionTime: 0,
    };

    if (sessions.length === 0) {
      return stats;
    }

    let totalScore = 0;
    let totalTime = 0;
    let completedCount = 0;

    for (const session of sessions) {
      if (session.status === "completed") {
        stats.completedSessions++;
        totalScore += session.currentScore;
        completedCount++;
        stats.bestScore = Math.max(stats.bestScore, session.currentScore);
      } else if (session.status === "abandoned") {
        stats.abandonedSessions++;
      }

      // Calculate session time
      if (session.endTime) {
        const sessionTimeMs = session.endTime - session.startTime;
        const sessionTimeMinutes = sessionTimeMs / (1000 * 60);
        totalTime += sessionTimeMinutes;
      }
    }

    if (completedCount > 0) {
      stats.averageScore = Math.round(totalScore / completedCount);
    }

    stats.totalTimeSpent = Math.round(totalTime);
    if (sessions.length > 0) {
      stats.averageSessionTime = Math.round(totalTime / sessions.length);
    }

    return stats;
  },
});
