import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper function to validate admin role using Clerk ID
 * This should be called at the beginning of all admin mutations
 */
export async function validateAdminRole(
  ctx: any,
  adminClerkId: string
): Promise<void> {
  try {
    if (!adminClerkId || typeof adminClerkId !== "string") {
      throw new Error("Invalid admin Clerk ID provided");
    }

    // Check if the user exists in our system
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", adminClerkId))
      .first();

    if (!user) {
      throw new Error(`User with Clerk ID ${adminClerkId} not found in system`);
    }

    // Note: Admin role validation is handled at the middleware/API layer
    // by checking Clerk's publicMetadata.role === "admin"
    // This function assumes the adminClerkId has already been validated
  } catch (error) {
    console.error("Error in validateAdminRole:", error);
    throw error;
  }
}

/**
 * Internal query to get user by Clerk ID
 */
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      clerkId: v.string(),
      email: v.string(),
      name: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
    };
  },
});

/**
 * Get current user's basic info - used when admin status is already verified
 */
export const getCurrentUserInfo = query({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      name: v.string(),
      email: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
    };
  },
});

/**
 * Get all users with their admin status for admin management
 */
export const getAllUsersForAdmin = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      name: v.string(),
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
  handler: async (ctx) => {
    try {
      const users = await ctx.db.query("users").collect();

      return users.map((user) => ({
        _id: user._id,
        _creationTime: user._creationTime,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        certificationLevel: user.certificationLevel,
        totalPoints: user.totalPoints,
        completedChallenges: user.completedChallenges,
      }));
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      return [];
    }
  },
});

/**
 * Get user progress summary for admin dashboard
 */
export const getUserProgressSummary = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      user: v.object({
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
        createdAt: v.number(),
      }),
      progressStats: v.object({
        totalGameSessions: v.number(),
        completedSessions: v.number(),
        averageScore: v.number(),
        totalTimeSpent: v.number(),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get game session statistics
    const gameSessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId))
      .collect();

    const completedSessions = gameSessions.filter(
      (session) => session.status === "completed"
    );

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

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        certificationLevel: user.certificationLevel,
        totalPoints: user.totalPoints,
        completedChallenges: user.completedChallenges,
        createdAt: user.createdAt,
      },
      progressStats: {
        totalGameSessions: gameSessions.length,
        completedSessions: completedSessions.length,
        averageScore: Math.round(averageScore),
        totalTimeSpent: Math.round(totalTimeSpent / (1000 * 60)), // Convert to minutes
      },
    };
  },
});

/**
 * Log admin actions for audit trail
 */
export const logAdminAction = mutation({
  args: {
    adminClerkId: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  returns: v.id("adminLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("adminLogs", {
      adminClerkId: args.adminClerkId,
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      details: args.details,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get recent admin activity logs
 */
export const getAdminLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("adminLogs"),
      _creationTime: v.number(),
      adminClerkId: v.string(),
      action: v.string(),
      resourceType: v.string(),
      resourceId: v.optional(v.string()),
      details: v.optional(v.string()),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 50;

      return await ctx.db
        .query("adminLogs")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      return [];
    }
  },
});
