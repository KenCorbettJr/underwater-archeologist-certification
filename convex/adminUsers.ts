import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateAdminRole } from "./adminAuth";
import { api } from "./_generated/api";

/**
 * Admin query to list all students with basic information
 */
export const getAllStudents = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    certificationLevel: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("certified")
      )
    ),
    sortBy: v.optional(
      v.union(
        v.literal("name"),
        v.literal("email"),
        v.literal("totalPoints"),
        v.literal("createdAt"),
        v.literal("certificationLevel")
      )
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: v.object({
    students: v.array(
      v.object({
        _id: v.id("users"),
        _creationTime: v.number(),
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        age: v.optional(v.number()),
        school: v.optional(v.string()),
        certificationLevel: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
          v.literal("certified")
        ),
        totalPoints: v.number(),
        completedChallenges: v.array(v.id("challenges")),
        createdAt: v.number(),
      })
    ),
    total: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let students;

    // Apply certification level filter if specified
    if (args.certificationLevel) {
      students = await ctx.db
        .query("users")
        .withIndex("by_certification_level", (q) =>
          q.eq("certificationLevel", args.certificationLevel!)
        )
        .collect();
    } else {
      students = await ctx.db.query("users").collect();
    }

    // Apply sorting
    if (args.sortBy) {
      const sortOrder = args.sortOrder || "asc";
      students.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (args.sortBy) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "email":
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case "totalPoints":
            aValue = a.totalPoints;
            bValue = b.totalPoints;
            break;
          case "createdAt":
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case "certificationLevel":
            const levelOrder = [
              "beginner",
              "intermediate",
              "advanced",
              "certified",
            ];
            aValue = levelOrder.indexOf(a.certificationLevel);
            bValue = levelOrder.indexOf(b.certificationLevel);
            break;
          default:
            aValue = a._creationTime;
            bValue = b._creationTime;
        }

        if (sortOrder === "desc") {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    const total = students.length;
    const paginatedStudents = students.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      students: paginatedStudents,
      total,
      hasMore,
    };
  },
});

/**
 * Admin query to get detailed student information including progress
 */
export const getStudentDetails = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      user: v.object({
        _id: v.id("users"),
        _creationTime: v.number(),
        clerkId: v.string(),
        email: v.string(),
        name: v.string(),
        age: v.optional(v.number()),
        school: v.optional(v.string()),
        certificationLevel: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
          v.literal("certified")
        ),
        totalPoints: v.number(),
        completedChallenges: v.array(v.id("challenges")),
        createdAt: v.number(),
      }),
      progressSummary: v.object({
        totalGameSessions: v.number(),
        completedSessions: v.number(),
        activeSessions: v.number(),
        averageScore: v.number(),
        totalTimeSpent: v.number(), // in minutes
        lastActivity: v.optional(v.number()),
        challengeProgress: v.object({
          completed: v.number(),
          inProgress: v.number(),
          notStarted: v.number(),
        }),
      }),
      certificationStatus: v.object({
        isEligible: v.boolean(),
        isCertified: v.boolean(),
        certificateId: v.optional(v.id("certificates")),
        requirementsProgress: v.object({
          pointsRequired: v.number(),
          pointsEarned: v.number(),
          challengesRequired: v.number(),
          challengesCompleted: v.number(),
        }),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get game session statistics
    const gameSessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId))
      .collect();

    const completedSessions = gameSessions.filter(
      (s) => s.status === "completed"
    );
    const activeSessions = gameSessions.filter((s) => s.status === "active");

    // Calculate total time spent and average score
    const totalTimeSpent = gameSessions.reduce((total, session) => {
      if (session.endTime && session.startTime) {
        return total + (session.endTime - session.startTime);
      }
      return total;
    }, 0);

    const averageScore =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum, session) => sum + session.currentScore,
            0
          ) / completedSessions.length
        : 0;

    // Get last activity
    const lastActivity =
      gameSessions.length > 0
        ? Math.max(...gameSessions.map((s) => s.startTime))
        : undefined;

    // Get challenge progress
    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId))
      .collect();

    const challengeProgress = {
      completed: userProgress.filter((p) => p.status === "completed").length,
      inProgress: userProgress.filter((p) => p.status === "in_progress").length,
      notStarted: userProgress.filter((p) => p.status === "not_started").length,
    };

    // Check certification status
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isValid"), true))
      .first();

    // Define certification requirements (these could be configurable)
    const certificationRequirements = {
      pointsRequired: 5000,
      challengesRequired: 20,
    };

    const certificationStatus = {
      isEligible:
        user.totalPoints >= certificationRequirements.pointsRequired &&
        user.completedChallenges.length >=
          certificationRequirements.challengesRequired,
      isCertified: !!certificate,
      certificateId: certificate?._id,
      requirementsProgress: {
        pointsRequired: certificationRequirements.pointsRequired,
        pointsEarned: user.totalPoints,
        challengesRequired: certificationRequirements.challengesRequired,
        challengesCompleted: user.completedChallenges.length,
      },
    };

    return {
      user,
      progressSummary: {
        totalGameSessions: gameSessions.length,
        completedSessions: completedSessions.length,
        activeSessions: activeSessions.length,
        averageScore: Math.round(averageScore),
        totalTimeSpent: Math.round(totalTimeSpent / (1000 * 60)), // Convert to minutes
        lastActivity,
        challengeProgress,
      },
      certificationStatus,
    };
  },
});

/**
 * Admin query to get student progress summary statistics
 */
export const getStudentProgressSummary = query({
  args: {},
  returns: v.object({
    totalStudents: v.number(),
    byCertificationLevel: v.object({
      beginner: v.number(),
      intermediate: v.number(),
      advanced: v.number(),
      certified: v.number(),
    }),
    engagementStats: v.object({
      activeLastWeek: v.number(),
      activeLastMonth: v.number(),
      totalGameSessions: v.number(),
      averageSessionsPerStudent: v.number(),
    }),
    certificationStats: v.object({
      eligible: v.number(),
      certified: v.number(),
      certificationRate: v.number(), // percentage
    }),
    topPerformers: v.array(
      v.object({
        userId: v.id("users"),
        name: v.string(),
        totalPoints: v.number(),
        certificationLevel: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
          v.literal("certified")
        ),
      })
    ),
  }),
  handler: async (ctx) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const allUsers = await ctx.db.query("users").collect();
    const totalStudents = allUsers.length;

    // Count by certification level
    const byCertificationLevel = {
      beginner: allUsers.filter((u) => u.certificationLevel === "beginner")
        .length,
      intermediate: allUsers.filter(
        (u) => u.certificationLevel === "intermediate"
      ).length,
      advanced: allUsers.filter((u) => u.certificationLevel === "advanced")
        .length,
      certified: allUsers.filter((u) => u.certificationLevel === "certified")
        .length,
    };

    // Get engagement statistics
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const allGameSessions = await ctx.db.query("gameSessions").collect();
    const activeLastWeek = new Set(
      allGameSessions
        .filter((s) => s.startTime >= oneWeekAgo)
        .map((s) => s.userId)
    ).size;

    const activeLastMonth = new Set(
      allGameSessions
        .filter((s) => s.startTime >= oneMonthAgo)
        .map((s) => s.userId)
    ).size;

    const averageSessionsPerStudent =
      totalStudents > 0
        ? Math.round((allGameSessions.length / totalStudents) * 10) / 10
        : 0;

    // Get certification statistics
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

    const certified = byCertificationLevel.certified;
    const certificationRate =
      eligible > 0 ? Math.round((certified / eligible) * 100) : 0;

    // Get top performers (top 10 by points)
    const topPerformers = allUsers
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
      .map((user) => ({
        userId: user._id,
        name: user.name,
        totalPoints: user.totalPoints,
        certificationLevel: user.certificationLevel,
      }));

    return {
      totalStudents,
      byCertificationLevel,
      engagementStats: {
        activeLastWeek,
        activeLastMonth,
        totalGameSessions: allGameSessions.length,
        averageSessionsPerStudent,
      },
      certificationStats: {
        eligible,
        certified,
        certificationRate,
      },
      topPerformers,
    };
  },
});

/**
 * Admin query to get certification status for all eligible students
 */
export const getCertificationCandidates = query({
  args: {},
  returns: v.array(
    v.object({
      user: v.object({
        _id: v.id("users"),
        name: v.string(),
        email: v.string(),
        totalPoints: v.number(),
        completedChallenges: v.array(v.id("challenges")),
        certificationLevel: v.union(
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
          v.literal("certified")
        ),
      }),
      isEligible: v.boolean(),
      isCertified: v.boolean(),
      certificateId: v.optional(v.id("certificates")),
      requirementsProgress: v.object({
        pointsRequired: v.number(),
        pointsEarned: v.number(),
        challengesRequired: v.number(),
        challengesCompleted: v.number(),
      }),
    })
  ),
  handler: async (ctx) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const allUsers = await ctx.db.query("users").collect();
    const allCertificates = await ctx.db
      .query("certificates")
      .filter((q) => q.eq(q.field("isValid"), true))
      .collect();

    // Create a map of user ID to certificate
    const certificateMap = new Map<string, any>();
    allCertificates.forEach((cert) => {
      certificateMap.set(cert.userId, cert);
    });

    // Define certification requirements
    const certificationRequirements = {
      pointsRequired: 5000,
      challengesRequired: 20,
    };

    const candidates = allUsers.map((user) => {
      const certificate = certificateMap.get(user._id);
      const isEligible =
        user.totalPoints >= certificationRequirements.pointsRequired &&
        user.completedChallenges.length >=
          certificationRequirements.challengesRequired;

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          totalPoints: user.totalPoints,
          completedChallenges: user.completedChallenges,
          certificationLevel: user.certificationLevel,
        },
        isEligible,
        isCertified: !!certificate,
        certificateId: certificate?._id,
        requirementsProgress: {
          pointsRequired: certificationRequirements.pointsRequired,
          pointsEarned: user.totalPoints,
          challengesRequired: certificationRequirements.challengesRequired,
          challengesCompleted: user.completedChallenges.length,
        },
      };
    });

    // Sort by eligibility first, then by points
    return candidates.sort((a, b) => {
      if (a.isEligible !== b.isEligible) {
        return a.isEligible ? -1 : 1;
      }
      return b.user.totalPoints - a.user.totalPoints;
    });
  },
});

/**
 * Admin mutation to manually update a student's certification level
 */
export const updateStudentCertificationLevel = mutation({
  args: {
    adminClerkId: v.string(),
    userId: v.id("users"),
    newLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("certified")
    ),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate admin role
    await validateAdminRole(ctx, args.adminClerkId);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const oldLevel = user.certificationLevel;

    // Update the user's certification level
    await ctx.db.patch(args.userId, {
      certificationLevel: args.newLevel,
    });

    // Log admin action
    await ctx.runMutation(api.adminAuth.logAdminAction, {
      adminClerkId: args.adminClerkId,
      action: "update_certification_level",
      resourceType: "users",
      resourceId: args.userId,
      details: `Changed certification level from ${oldLevel} to ${args.newLevel} for ${user.name}${args.reason ? `. Reason: ${args.reason}` : ""}`,
    });

    return null;
  },
});

/**
 * Admin query to search students by name or email
 */
export const searchStudents = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      certificationLevel: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("certified")
      ),
      totalPoints: v.number(),
      completedChallenges: v.array(v.id("challenges")),
    })
  ),
  handler: async (ctx, args) => {
    // Note: This is a query function, admin validation is handled at the API layer

    const limit = args.limit || 20;
    const searchTerm = args.searchTerm.toLowerCase().trim();

    if (!searchTerm) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();

    // Filter users by name or email containing the search term
    const matchingUsers = allUsers
      .filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);

    return matchingUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      certificationLevel: user.certificationLevel,
      totalPoints: user.totalPoints,
      completedChallenges: user.completedChallenges,
    }));
  },
});
