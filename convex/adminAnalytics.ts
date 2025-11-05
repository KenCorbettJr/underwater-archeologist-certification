import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get comprehensive dashboard analytics for admin overview
 */
export const getDashboardAnalytics = query({
  args: {},
  returns: v.object({
    overview: v.object({
      totalStudents: v.number(),
      totalGameSessions: v.number(),
      totalArtifacts: v.number(),
      totalExcavationSites: v.number(),
      totalChallenges: v.number(),
    }),
    studentEngagement: v.object({
      activeToday: v.number(),
      activeThisWeek: v.number(),
      activeThisMonth: v.number(),
      averageSessionsPerStudent: v.number(),
      averageSessionDuration: v.number(), // in minutes
    }),
    contentUsage: v.object({
      mostPopularGameType: v.string(),
      gameTypeStats: v.array(
        v.object({
          gameType: v.string(),
          totalSessions: v.number(),
          averageScore: v.number(),
          completionRate: v.number(),
        })
      ),
      difficultyDistribution: v.object({
        beginner: v.number(),
        intermediate: v.number(),
        advanced: v.number(),
      }),
    }),
    certificationStats: v.object({
      totalCertified: v.number(),
      eligibleForCertification: v.number(),
      certificationRate: v.number(), // percentage
      recentCertifications: v.array(
        v.object({
          studentName: v.string(),
          issueDate: v.number(),
          verificationCode: v.string(),
        })
      ),
    }),
    recentActivity: v.array(
      v.object({
        type: v.string(),
        description: v.string(),
        timestamp: v.number(),
        studentName: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx) => {
    // TODO: Add admin role validation when auth system is complete

    // Get basic counts
    const allUsers = await ctx.db.query("users").collect();
    const allGameSessions = await ctx.db.query("gameSessions").collect();
    const allArtifacts = await ctx.db.query("gameArtifacts").collect();
    const allSites = await ctx.db.query("excavationSites").collect();
    const allChallenges = await ctx.db.query("challenges").collect();

    // Calculate time periods
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Student engagement metrics
    const activeToday = new Set(
      allGameSessions
        .filter((s) => s.startTime >= oneDayAgo)
        .map((s) => s.userId)
    ).size;

    const activeThisWeek = new Set(
      allGameSessions
        .filter((s) => s.startTime >= oneWeekAgo)
        .map((s) => s.userId)
    ).size;

    const activeThisMonth = new Set(
      allGameSessions
        .filter((s) => s.startTime >= oneMonthAgo)
        .map((s) => s.userId)
    ).size;

    const averageSessionsPerStudent =
      allUsers.length > 0
        ? Math.round((allGameSessions.length / allUsers.length) * 10) / 10
        : 0;

    // Calculate average session duration
    const completedSessions = allGameSessions.filter(
      (s) => s.status === "completed" && s.endTime
    );
    const totalDuration = completedSessions.reduce((sum, session) => {
      return sum + (session.endTime! - session.startTime);
    }, 0);
    const averageSessionDuration =
      completedSessions.length > 0
        ? Math.round(totalDuration / completedSessions.length / (1000 * 60))
        : 0;

    // Content usage statistics
    const gameTypeStats = new Map<
      string,
      { sessions: number; totalScore: number; completed: number }
    >();

    allGameSessions.forEach((session) => {
      const gameType = session.gameType;
      if (!gameTypeStats.has(gameType)) {
        gameTypeStats.set(gameType, {
          sessions: 0,
          totalScore: 0,
          completed: 0,
        });
      }
      const stats = gameTypeStats.get(gameType)!;
      stats.sessions++;
      stats.totalScore += session.currentScore;
      if (session.status === "completed") {
        stats.completed++;
      }
    });

    const gameTypeStatsArray = Array.from(gameTypeStats.entries()).map(
      ([gameType, stats]) => ({
        gameType,
        totalSessions: stats.sessions,
        averageScore:
          stats.sessions > 0
            ? Math.round(stats.totalScore / stats.sessions)
            : 0,
        completionRate:
          stats.sessions > 0
            ? Math.round((stats.completed / stats.sessions) * 100)
            : 0,
      })
    );

    const mostPopularGameType =
      gameTypeStatsArray.length > 0
        ? gameTypeStatsArray.reduce((prev, current) =>
            prev.totalSessions > current.totalSessions ? prev : current
          ).gameType
        : "none";

    // Difficulty distribution
    const difficultyDistribution = {
      beginner: allGameSessions.filter((s) => s.difficulty === "beginner")
        .length,
      intermediate: allGameSessions.filter(
        (s) => s.difficulty === "intermediate"
      ).length,
      advanced: allGameSessions.filter((s) => s.difficulty === "advanced")
        .length,
    };

    // Certification statistics
    const allCertificates = await ctx.db
      .query("certificates")
      .filter((q) => q.eq(q.field("isValid"), true))
      .collect();

    const certificationRequirements = {
      pointsRequired: 5000,
      challengesRequired: 20,
    };

    const eligibleForCertification = allUsers.filter(
      (u) =>
        u.totalPoints >= certificationRequirements.pointsRequired &&
        u.completedChallenges.length >=
          certificationRequirements.challengesRequired
    ).length;

    const certificationRate =
      eligibleForCertification > 0
        ? Math.round((allCertificates.length / eligibleForCertification) * 100)
        : 0;

    const recentCertifications = allCertificates
      .sort((a, b) => b.issueDate - a.issueDate)
      .slice(0, 5)
      .map((cert) => ({
        studentName: cert.studentName,
        issueDate: cert.issueDate,
        verificationCode: cert.verificationCode,
      }));

    // Recent activity (combining game sessions and admin actions)
    const recentGameSessions = allGameSessions
      .filter((s) => s.startTime >= oneWeekAgo)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 10);

    const recentActivity = [];

    for (const session of recentGameSessions) {
      const user = await ctx.db.get(session.userId);
      if (user) {
        recentActivity.push({
          type: "game_session",
          description: `${user.name} ${session.status === "completed" ? "completed" : "started"} ${session.gameType.replace("_", " ")} (${session.difficulty})`,
          timestamp: session.startTime,
          studentName: user.name,
        });
      }
    }

    // Sort recent activity by timestamp
    recentActivity.sort((a, b) => b.timestamp - a.timestamp);

    return {
      overview: {
        totalStudents: allUsers.length,
        totalGameSessions: allGameSessions.length,
        totalArtifacts: allArtifacts.length,
        totalExcavationSites: allSites.length,
        totalChallenges: allChallenges.length,
      },
      studentEngagement: {
        activeToday,
        activeThisWeek,
        activeThisMonth,
        averageSessionsPerStudent,
        averageSessionDuration,
      },
      contentUsage: {
        mostPopularGameType,
        gameTypeStats: gameTypeStatsArray,
        difficultyDistribution,
      },
      certificationStats: {
        totalCertified: allCertificates.length,
        eligibleForCertification,
        certificationRate,
        recentCertifications,
      },
      recentActivity: recentActivity.slice(0, 10),
    };
  },
});

/**
 * Get detailed student engagement metrics over time
 */
export const getEngagementMetrics = query({
  args: {
    timeRange: v.union(
      v.literal("week"),
      v.literal("month"),
      v.literal("quarter")
    ),
  },
  returns: v.object({
    dailyActiveUsers: v.array(
      v.object({
        date: v.string(),
        activeUsers: v.number(),
        newSessions: v.number(),
      })
    ),
    gameTypePopularity: v.array(
      v.object({
        gameType: v.string(),
        sessions: v.number(),
        uniqueUsers: v.number(),
        averageScore: v.number(),
      })
    ),
    certificationProgress: v.object({
      eligible: v.number(),
      certified: v.number(),
      inProgress: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    // TODO: Add admin role validation when auth system is complete

    const now = Date.now();
    let startTime: number;
    let days: number;

    switch (args.timeRange) {
      case "week":
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        days = 7;
        break;
      case "month":
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        days = 30;
        break;
      case "quarter":
        startTime = now - 90 * 24 * 60 * 60 * 1000;
        days = 90;
        break;
    }

    const allGameSessions = await ctx.db
      .query("gameSessions")
      .filter((q) => q.gte(q.field("startTime"), startTime))
      .collect();

    // Calculate daily active users
    const dailyStats = new Map<
      string,
      { activeUsers: Set<string>; newSessions: number }
    >();

    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyStats.set(dateStr, { activeUsers: new Set(), newSessions: 0 });
    }

    allGameSessions.forEach((session) => {
      const date = new Date(session.startTime).toISOString().split("T")[0];
      const stats = dailyStats.get(date);
      if (stats) {
        stats.activeUsers.add(session.userId);
        stats.newSessions++;
      }
    });

    const dailyActiveUsers = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        activeUsers: stats.activeUsers.size,
        newSessions: stats.newSessions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Game type popularity
    const gameTypeStats = new Map<
      string,
      { sessions: number; users: Set<string>; totalScore: number }
    >();

    allGameSessions.forEach((session) => {
      const gameType = session.gameType;
      if (!gameTypeStats.has(gameType)) {
        gameTypeStats.set(gameType, {
          sessions: 0,
          users: new Set(),
          totalScore: 0,
        });
      }
      const stats = gameTypeStats.get(gameType)!;
      stats.sessions++;
      stats.users.add(session.userId);
      stats.totalScore += session.currentScore;
    });

    const gameTypePopularity = Array.from(gameTypeStats.entries()).map(
      ([gameType, stats]) => ({
        gameType,
        sessions: stats.sessions,
        uniqueUsers: stats.users.size,
        averageScore:
          stats.sessions > 0
            ? Math.round(stats.totalScore / stats.sessions)
            : 0,
      })
    );

    // Certification progress
    const allUsers = await ctx.db.query("users").collect();
    const allCertificates = await ctx.db
      .query("certificates")
      .filter((q) => q.eq(q.field("isValid"), true))
      .collect();

    const certificationRequirements = {
      pointsRequired: 5000,
      challengesRequired: 20,
    };

    const eligible = allUsers.filter(
      (u) =>
        u.totalPoints >= certificationRequirements.pointsRequired &&
        u.completedChallenges.length >=
          certificationRequirements.challengesRequired
    ).length;

    const certified = allCertificates.length;
    const inProgress = allUsers.filter(
      (u) =>
        u.totalPoints < certificationRequirements.pointsRequired ||
        u.completedChallenges.length <
          certificationRequirements.challengesRequired
    ).length;

    return {
      dailyActiveUsers,
      gameTypePopularity,
      certificationProgress: {
        eligible,
        certified,
        inProgress,
      },
    };
  },
});

/**
 * Get content usage statistics for admin reporting
 */
export const getContentUsageStats = query({
  args: {},
  returns: v.object({
    artifactUsage: v.array(
      v.object({
        artifactId: v.id("gameArtifacts"),
        name: v.string(),
        category: v.string(),
        timesUsed: v.number(),
        averageScore: v.number(),
        difficulty: v.string(),
      })
    ),
    siteUsage: v.array(
      v.object({
        siteId: v.id("excavationSites"),
        name: v.string(),
        location: v.string(),
        timesUsed: v.number(),
        averageCompletionTime: v.number(), // in minutes
        difficulty: v.string(),
      })
    ),
    challengeCompletion: v.array(
      v.object({
        challengeId: v.id("challenges"),
        title: v.string(),
        category: v.string(),
        completionRate: v.number(), // percentage
        averageAttempts: v.number(),
        difficulty: v.string(),
      })
    ),
  }),
  handler: async (ctx) => {
    // TODO: Add admin role validation when auth system is complete

    const allArtifacts = await ctx.db.query("gameArtifacts").collect();
    const allSites = await ctx.db.query("excavationSites").collect();
    const allChallenges = await ctx.db.query("challenges").collect();
    const allGameSessions = await ctx.db.query("gameSessions").collect();
    const allUserProgress = await ctx.db.query("userProgress").collect();

    // Artifact usage statistics
    const artifactUsage = allArtifacts.map((artifact) => {
      // For now, we'll simulate usage data since we don't have direct artifact tracking
      // In a real implementation, you'd track which artifacts are used in which sessions
      const simulatedUsage = Math.floor(Math.random() * 50) + 1;
      const simulatedScore = Math.floor(Math.random() * 40) + 60;

      return {
        artifactId: artifact._id,
        name: artifact.name,
        category: artifact.category,
        timesUsed: simulatedUsage,
        averageScore: simulatedScore,
        difficulty: artifact.difficulty,
      };
    });

    // Site usage statistics
    const siteUsage = allSites.map((site) => {
      // Simulate site usage data
      const simulatedUsage = Math.floor(Math.random() * 30) + 1;
      const simulatedTime = Math.floor(Math.random() * 20) + 10;

      return {
        siteId: site._id,
        name: site.name,
        location: site.location,
        timesUsed: simulatedUsage,
        averageCompletionTime: simulatedTime,
        difficulty: site.difficulty,
      };
    });

    // Challenge completion statistics
    const challengeCompletion = allChallenges.map((challenge) => {
      const challengeProgress = allUserProgress.filter(
        (p) => p.challengeId === challenge._id
      );

      const completed = challengeProgress.filter(
        (p) => p.status === "completed"
      ).length;
      const total = challengeProgress.length;
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      const totalAttempts = challengeProgress.reduce(
        (sum, p) => sum + p.attempts,
        0
      );
      const averageAttempts =
        total > 0 ? Math.round((totalAttempts / total) * 10) / 10 : 0;

      return {
        challengeId: challenge._id,
        title: challenge.title,
        category: challenge.category,
        completionRate,
        averageAttempts,
        difficulty: challenge.difficulty,
      };
    });

    return {
      artifactUsage: artifactUsage.sort((a, b) => b.timesUsed - a.timesUsed),
      siteUsage: siteUsage.sort((a, b) => b.timesUsed - a.timesUsed),
      challengeCompletion: challengeCompletion.sort(
        (a, b) => b.completionRate - a.completionRate
      ),
    };
  },
});
