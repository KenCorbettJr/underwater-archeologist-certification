import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate student progress report data
 */
export const getStudentProgressReport = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      name: v.string(),
      email: v.string(),
      totalPoints: v.number(),
      completedChallenges: v.number(),
      totalGameSessions: v.number(),
      averageScore: v.number(),
      lastActive: v.number(),
      certificationStatus: v.string(),
      gameTypeBreakdown: v.array(
        v.object({
          gameType: v.string(),
          sessions: v.number(),
          averageScore: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const allGameSessions = await ctx.db.query("gameSessions").collect();
    const allCertificates = await ctx.db
      .query("certificates")
      .filter((q) => q.eq(q.field("isValid"), true))
      .collect();

    const certificationRequirements = {
      pointsRequired: 5000,
      challengesRequired: 20,
    };

    const report = [];

    for (const user of allUsers) {
      const userSessions = allGameSessions.filter((s) => s.userId === user._id);

      // Calculate average score
      const totalScore = userSessions.reduce(
        (sum, session) => sum + session.currentScore,
        0
      );
      const averageScore =
        userSessions.length > 0
          ? Math.round(totalScore / userSessions.length)
          : 0;

      // Get last active time
      const lastActive =
        userSessions.length > 0
          ? Math.max(...userSessions.map((s) => s.startTime))
          : user._creationTime;

      // Determine certification status
      const isCertified = allCertificates.some((c) => c.userId === user._id);
      const isEligible =
        user.totalPoints >= certificationRequirements.pointsRequired &&
        user.completedChallenges.length >=
          certificationRequirements.challengesRequired;

      let certificationStatus = "Not Eligible";
      if (isCertified) {
        certificationStatus = "Certified";
      } else if (isEligible) {
        certificationStatus = "Eligible";
      } else {
        certificationStatus = "In Progress";
      }

      // Game type breakdown
      const gameTypeStats = new Map<
        string,
        { sessions: number; totalScore: number }
      >();

      userSessions.forEach((session) => {
        const gameType = session.gameType;
        if (!gameTypeStats.has(gameType)) {
          gameTypeStats.set(gameType, { sessions: 0, totalScore: 0 });
        }
        const stats = gameTypeStats.get(gameType)!;
        stats.sessions++;
        stats.totalScore += session.currentScore;
      });

      const gameTypeBreakdown = Array.from(gameTypeStats.entries()).map(
        ([gameType, stats]) => ({
          gameType,
          sessions: stats.sessions,
          averageScore:
            stats.sessions > 0
              ? Math.round(stats.totalScore / stats.sessions)
              : 0,
        })
      );

      report.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        totalPoints: user.totalPoints,
        completedChallenges: user.completedChallenges.length,
        totalGameSessions: userSessions.length,
        averageScore,
        lastActive,
        certificationStatus,
        gameTypeBreakdown,
      });
    }

    // Sort by total points descending
    return report.sort((a, b) => b.totalPoints - a.totalPoints);
  },
});

/**
 * Generate engagement analytics report
 */
export const getEngagementReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  returns: v.object({
    summary: v.object({
      totalSessions: v.number(),
      uniqueUsers: v.number(),
      averageSessionDuration: v.number(),
      totalTimeSpent: v.number(),
      completionRate: v.number(),
    }),
    dailyMetrics: v.array(
      v.object({
        date: v.string(),
        sessions: v.number(),
        uniqueUsers: v.number(),
        averageDuration: v.number(),
      })
    ),
    gameTypeMetrics: v.array(
      v.object({
        gameType: v.string(),
        sessions: v.number(),
        uniqueUsers: v.number(),
        averageScore: v.number(),
        completionRate: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const allSessions = await ctx.db
      .query("gameSessions")
      .filter((q) => q.gte(q.field("startTime"), args.startDate))
      .filter((q) => q.lte(q.field("startTime"), args.endDate))
      .collect();

    // Summary metrics
    const uniqueUsers = new Set(allSessions.map((s) => s.userId)).size;
    const completedSessions = allSessions.filter(
      (s) => s.status === "completed"
    );
    const totalDuration = completedSessions.reduce((sum, session) => {
      return sum + (session.endTime ? session.endTime - session.startTime : 0);
    }, 0);
    const averageSessionDuration =
      completedSessions.length > 0
        ? Math.round(totalDuration / completedSessions.length / (1000 * 60))
        : 0;
    const completionRate =
      allSessions.length > 0
        ? Math.round((completedSessions.length / allSessions.length) * 100)
        : 0;

    // Daily metrics
    const dailyStats = new Map<
      string,
      { sessions: number; users: Set<string>; duration: number }
    >();

    allSessions.forEach((session) => {
      const date = new Date(session.startTime).toISOString().split("T")[0];
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { sessions: 0, users: new Set(), duration: 0 });
      }
      const stats = dailyStats.get(date)!;
      stats.sessions++;
      stats.users.add(session.userId);
      if (session.status === "completed" && session.endTime) {
        stats.duration += session.endTime - session.startTime;
      }
    });

    const dailyMetrics = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        sessions: stats.sessions,
        uniqueUsers: stats.users.size,
        averageDuration:
          stats.sessions > 0
            ? Math.round(stats.duration / stats.sessions / (1000 * 60))
            : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Game type metrics
    const gameTypeStats = new Map<
      string,
      {
        sessions: number;
        users: Set<string>;
        totalScore: number;
        completed: number;
      }
    >();

    allSessions.forEach((session) => {
      const gameType = session.gameType;
      if (!gameTypeStats.has(gameType)) {
        gameTypeStats.set(gameType, {
          sessions: 0,
          users: new Set(),
          totalScore: 0,
          completed: 0,
        });
      }
      const stats = gameTypeStats.get(gameType)!;
      stats.sessions++;
      stats.users.add(session.userId);
      stats.totalScore += session.currentScore;
      if (session.status === "completed") {
        stats.completed++;
      }
    });

    const gameTypeMetrics = Array.from(gameTypeStats.entries()).map(
      ([gameType, stats]) => ({
        gameType,
        sessions: stats.sessions,
        uniqueUsers: stats.users.size,
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

    return {
      summary: {
        totalSessions: allSessions.length,
        uniqueUsers,
        averageSessionDuration,
        totalTimeSpent: Math.round(totalDuration / (1000 * 60)),
        completionRate,
      },
      dailyMetrics,
      gameTypeMetrics,
    };
  },
});

/**
 * Generate content usage report
 */
export const getContentUsageReport = query({
  args: {},
  returns: v.object({
    artifacts: v.array(
      v.object({
        artifactId: v.id("gameArtifacts"),
        name: v.string(),
        category: v.string(),
        difficulty: v.string(),
        timesViewed: v.number(),
        averageEngagementTime: v.number(),
        isActive: v.boolean(),
      })
    ),
    sites: v.array(
      v.object({
        siteId: v.id("excavationSites"),
        name: v.string(),
        location: v.string(),
        difficulty: v.string(),
        timesPlayed: v.number(),
        averageCompletionTime: v.number(),
        completionRate: v.number(),
        isActive: v.boolean(),
      })
    ),
    challenges: v.array(
      v.object({
        challengeId: v.id("challenges"),
        title: v.string(),
        category: v.string(),
        difficulty: v.string(),
        totalAttempts: v.number(),
        completions: v.number(),
        completionRate: v.number(),
        averageAttempts: v.number(),
        isActive: v.boolean(),
      })
    ),
  }),
  handler: async (ctx) => {
    const allArtifacts = await ctx.db.query("gameArtifacts").collect();
    const allSites = await ctx.db.query("excavationSites").collect();
    const allChallenges = await ctx.db.query("challenges").collect();
    const allUserProgress = await ctx.db.query("userProgress").collect();

    // Artifact usage (simulated for now)
    const artifacts = allArtifacts.map((artifact) => ({
      artifactId: artifact._id,
      name: artifact.name,
      category: artifact.category,
      difficulty: artifact.difficulty,
      timesViewed: Math.floor(Math.random() * 100) + 1,
      averageEngagementTime: Math.floor(Math.random() * 120) + 30,
      isActive: artifact.isActive,
    }));

    // Site usage (simulated for now)
    const sites = allSites.map((site) => ({
      siteId: site._id,
      name: site.name,
      location: site.location,
      difficulty: site.difficulty,
      timesPlayed: Math.floor(Math.random() * 50) + 1,
      averageCompletionTime: Math.floor(Math.random() * 30) + 10,
      completionRate: Math.floor(Math.random() * 40) + 60,
      isActive: site.isActive,
    }));

    // Challenge usage
    const challenges = allChallenges.map((challenge) => {
      const challengeProgress = allUserProgress.filter(
        (p) => p.challengeId === challenge._id
      );

      const completions = challengeProgress.filter(
        (p) => p.status === "completed"
      ).length;
      const totalAttempts = challengeProgress.reduce(
        (sum, p) => sum + p.attempts,
        0
      );
      const completionRate =
        challengeProgress.length > 0
          ? Math.round((completions / challengeProgress.length) * 100)
          : 0;
      const averageAttempts =
        challengeProgress.length > 0
          ? Math.round((totalAttempts / challengeProgress.length) * 10) / 10
          : 0;

      return {
        challengeId: challenge._id,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
        totalAttempts: challengeProgress.length,
        completions,
        completionRate,
        averageAttempts,
        isActive: challenge.isActive,
      };
    });

    return {
      artifacts: artifacts.sort((a, b) => b.timesViewed - a.timesViewed),
      sites: sites.sort((a, b) => b.timesPlayed - a.timesPlayed),
      challenges: challenges.sort((a, b) => b.totalAttempts - a.totalAttempts),
    };
  },
});
