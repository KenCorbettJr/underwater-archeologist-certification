import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get overall progress for a user
 */
export const getOverallProgress = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      overallCompletion: v.number(),
      certificationStatus: v.union(
        v.literal("not_eligible"),
        v.literal("eligible"),
        v.literal("certified")
      ),
      lastActivity: v.number(),
      totalGameTime: v.number(),
      totalScore: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("overallProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return progress || null;
  },
});

/**
 * Get game-specific progress for a user
 */
export const getGameProgress = query({
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
  returns: v.array(
    v.object({
      _id: v.id("studentProgress"),
      _creationTime: v.number(),
      userId: v.id("users"),
      gameType: v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      ),
      completedLevels: v.number(),
      totalLevels: v.number(),
      bestScore: v.number(),
      averageScore: v.number(),
      timeSpent: v.number(),
      lastPlayed: v.number(),
      achievements: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("studentProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    const allProgress = await query.collect();

    if (args.gameType) {
      return allProgress.filter((p) => p.gameType === args.gameType);
    }

    return allProgress;
  },
});

/**
 * Get all game sessions for a user
 */
export const getUserGameSessions = query({
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
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("abandoned")
      )
    ),
  },
  returns: v.array(
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
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId));

    let sessions = await query.collect();

    if (args.gameType) {
      sessions = sessions.filter((s) => s.gameType === args.gameType);
    }

    if (args.status) {
      sessions = sessions.filter((s) => s.status === args.status);
    }

    return sessions;
  },
});

/**
 * Update or create student progress for a game type
 */
export const updateStudentProgress = mutation({
  args: {
    userId: v.id("users"),
    gameType: v.union(
      v.literal("artifact_identification"),
      v.literal("excavation_simulation"),
      v.literal("site_documentation"),
      v.literal("historical_timeline"),
      v.literal("conservation_lab")
    ),
    completedLevels: v.number(),
    totalLevels: v.number(),
    bestScore: v.number(),
    averageScore: v.number(),
    timeSpent: v.number(),
    achievements: v.array(v.string()),
  },
  returns: v.id("studentProgress"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studentProgress")
      .withIndex("by_user_and_game_type", (q) =>
        q.eq("userId", args.userId).eq("gameType", args.gameType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completedLevels: args.completedLevels,
        totalLevels: args.totalLevels,
        bestScore: args.bestScore,
        averageScore: args.averageScore,
        timeSpent: args.timeSpent,
        lastPlayed: Date.now(),
        achievements: args.achievements,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("studentProgress", {
        userId: args.userId,
        gameType: args.gameType,
        completedLevels: args.completedLevels,
        totalLevels: args.totalLevels,
        bestScore: args.bestScore,
        averageScore: args.averageScore,
        timeSpent: args.timeSpent,
        lastPlayed: Date.now(),
        achievements: args.achievements,
      });
    }
  },
});

/**
 * Update or create overall progress for a user
 */
export const updateOverallProgress = mutation({
  args: {
    userId: v.id("users"),
    overallCompletion: v.number(),
    certificationStatus: v.union(
      v.literal("not_eligible"),
      v.literal("eligible"),
      v.literal("certified")
    ),
    totalGameTime: v.number(),
    totalScore: v.number(),
  },
  returns: v.id("overallProgress"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("overallProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        overallCompletion: args.overallCompletion,
        certificationStatus: args.certificationStatus,
        lastActivity: Date.now(),
        totalGameTime: args.totalGameTime,
        totalScore: args.totalScore,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("overallProgress", {
        userId: args.userId,
        overallCompletion: args.overallCompletion,
        certificationStatus: args.certificationStatus,
        lastActivity: Date.now(),
        totalGameTime: args.totalGameTime,
        totalScore: args.totalScore,
      });
    }
  },
});

/**
 * Create a progress history snapshot
 */
export const createProgressSnapshot = mutation({
  args: {
    userId: v.id("users"),
    gameType: v.union(
      v.literal("artifact_identification"),
      v.literal("excavation_simulation"),
      v.literal("site_documentation"),
      v.literal("historical_timeline"),
      v.literal("conservation_lab")
    ),
    completedLevels: v.number(),
    totalLevels: v.number(),
    score: v.number(),
    timeSpent: v.number(),
    overallCompletion: v.number(),
    snapshotData: v.string(),
  },
  returns: v.id("progressHistory"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("progressHistory", {
      userId: args.userId,
      timestamp: Date.now(),
      gameType: args.gameType,
      completedLevels: args.completedLevels,
      totalLevels: args.totalLevels,
      score: args.score,
      timeSpent: args.timeSpent,
      overallCompletion: args.overallCompletion,
      snapshotData: args.snapshotData,
    });
  },
});

/**
 * Get progress history for trend analysis
 */
export const getProgressHistory = query({
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
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("progressHistory"),
      userId: v.id("users"),
      timestamp: v.number(),
      gameType: v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      ),
      completedLevels: v.number(),
      totalLevels: v.number(),
      score: v.number(),
      timeSpent: v.number(),
      overallCompletion: v.number(),
      snapshotData: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("progressHistory")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId));

    let history = await query.collect();

    // Filter by game type if specified
    if (args.gameType) {
      history = history.filter((h) => h.gameType === args.gameType);
    }

    // Filter by date range if specified
    if (args.startDate) {
      history = history.filter((h) => h.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      history = history.filter((h) => h.timestamp <= args.endDate!);
    }

    // Sort by timestamp descending
    return history.sort((a, b) => b.timestamp - a.timestamp);
  },
});

/**
 * Create a progress backup
 */
export const createProgressBackup = mutation({
  args: {
    userId: v.id("users"),
    backupData: v.string(),
    backupType: v.union(
      v.literal("automatic"),
      v.literal("manual"),
      v.literal("pre_sync")
    ),
    deviceInfo: v.optional(v.string()),
  },
  returns: v.id("progressBackups"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("progressBackups", {
      userId: args.userId,
      backupDate: Date.now(),
      backupData: args.backupData,
      backupType: args.backupType,
      deviceInfo: args.deviceInfo,
    });
  },
});

/**
 * Get all backups for a user
 */
export const getUserBackups = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("progressBackups"),
      _creationTime: v.number(),
      userId: v.id("users"),
      backupDate: v.number(),
      backupData: v.string(),
      backupType: v.union(
        v.literal("automatic"),
        v.literal("manual"),
        v.literal("pre_sync")
      ),
      deviceInfo: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const backups = await ctx.db
      .query("progressBackups")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (args.limit) {
      return backups.slice(0, args.limit);
    }

    return backups;
  },
});

/**
 * Restore progress from a backup
 */
export const restoreProgressFromBackup = mutation({
  args: {
    backupId: v.id("progressBackups"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const backup = await ctx.db.get(args.backupId);

    if (!backup) {
      return {
        success: false,
        message: "Backup not found",
      };
    }

    try {
      const backupData = JSON.parse(backup.backupData);

      // Restore overall progress
      if (backupData.overallProgress) {
        const existing = await ctx.db
          .query("overallProgress")
          .withIndex("by_user", (q) => q.eq("userId", backup.userId))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, backupData.overallProgress);
        } else {
          await ctx.db.insert("overallProgress", {
            userId: backup.userId,
            ...backupData.overallProgress,
          });
        }
      }

      // Restore game-specific progress
      if (backupData.gameProgress && Array.isArray(backupData.gameProgress)) {
        for (const gameProgress of backupData.gameProgress) {
          const existing = await ctx.db
            .query("studentProgress")
            .withIndex("by_user_and_game_type", (q) =>
              q
                .eq("userId", backup.userId)
                .eq("gameType", gameProgress.gameType)
            )
            .first();

          if (existing) {
            await ctx.db.patch(existing._id, gameProgress);
          } else {
            await ctx.db.insert("studentProgress", {
              userId: backup.userId,
              ...gameProgress,
            });
          }
        }
      }

      return {
        success: true,
        message: "Progress restored successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restore progress: ${error}`,
      };
    }
  },
});

/**
 * Synchronize progress across devices
 */
export const syncProgress = mutation({
  args: {
    userId: v.id("users"),
    deviceInfo: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    lastSyncTime: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      // Create a pre-sync backup
      const overallProgress = await ctx.db
        .query("overallProgress")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();

      const gameProgress = await ctx.db
        .query("studentProgress")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const backupData = {
        overallProgress: overallProgress || null,
        gameProgress: gameProgress,
        syncTime: Date.now(),
      };

      await ctx.db.insert("progressBackups", {
        userId: args.userId,
        backupDate: Date.now(),
        backupData: JSON.stringify(backupData),
        backupType: "pre_sync",
        deviceInfo: args.deviceInfo,
      });

      // Convex handles real-time synchronization automatically
      // This function primarily creates a backup point and confirms sync

      return {
        success: true,
        message: "Progress synchronized successfully",
        lastSyncTime: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Sync failed: ${error}`,
        lastSyncTime: Date.now(),
      };
    }
  },
});

/**
 * Get progress trends for analytics
 */
export const getProgressTrends = query({
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
    days: v.optional(v.number()),
  },
  returns: v.object({
    trends: v.array(
      v.object({
        date: v.number(),
        completionPercentage: v.number(),
        averageScore: v.number(),
        timeSpent: v.number(),
      })
    ),
    summary: v.object({
      totalImprovement: v.number(),
      averageScoreChange: v.number(),
      totalTimeSpent: v.number(),
      mostActiveDay: v.optional(v.number()),
    }),
  }),
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    let query = ctx.db
      .query("progressHistory")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId));

    let history = await query.collect();

    // Filter by game type and date range
    history = history.filter((h) => {
      const matchesGameType = !args.gameType || h.gameType === args.gameType;
      const matchesDate = h.timestamp >= startDate;
      return matchesGameType && matchesDate;
    });

    // Group by day and calculate trends
    const trendsByDay = new Map<
      string,
      {
        date: number;
        completionSum: number;
        scoreSum: number;
        timeSum: number;
        count: number;
      }
    >();

    for (const record of history) {
      const dayKey = new Date(record.timestamp).toISOString().split("T")[0];
      const existing = trendsByDay.get(dayKey) || {
        date: new Date(dayKey).getTime(),
        completionSum: 0,
        scoreSum: 0,
        timeSum: 0,
        count: 0,
      };

      existing.completionSum += record.overallCompletion;
      existing.scoreSum += record.score;
      existing.timeSum += record.timeSpent;
      existing.count += 1;

      trendsByDay.set(dayKey, existing);
    }

    // Calculate averages and format trends
    const trends = Array.from(trendsByDay.values())
      .map((day) => ({
        date: day.date,
        completionPercentage: day.completionSum / day.count,
        averageScore: day.scoreSum / day.count,
        timeSpent: day.timeSum,
      }))
      .sort((a, b) => a.date - b.date);

    // Calculate summary statistics
    const totalImprovement =
      trends.length >= 2
        ? trends[trends.length - 1].completionPercentage -
          trends[0].completionPercentage
        : 0;

    const averageScoreChange =
      trends.length >= 2
        ? trends[trends.length - 1].averageScore - trends[0].averageScore
        : 0;

    const totalTimeSpent = trends.reduce((sum, t) => sum + t.timeSpent, 0);

    const mostActiveDay =
      trends.length > 0
        ? trends.reduce((max, t) => (t.timeSpent > max.timeSpent ? t : max))
            .date
        : undefined;

    return {
      trends,
      summary: {
        totalImprovement,
        averageScoreChange,
        totalTimeSpent,
        mostActiveDay,
      },
    };
  },
});

/**
 * Clean up old progress history (keep last 90 days)
 */
export const cleanupOldHistory = mutation({
  args: {
    daysToKeep: v.optional(v.number()),
  },
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const daysToKeep = args.daysToKeep || 90;
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const oldRecords = await ctx.db
      .query("progressHistory")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    return {
      deletedCount: oldRecords.length,
    };
  },
});
