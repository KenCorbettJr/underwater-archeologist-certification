import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper function to validate admin role using Clerk ID
 * This should be called at the beginning of all admin mutations
 */
export async function validateAdminRole(
  ctx: any,
  adminClerkId: string
): Promise<void> {
  // In a production environment, you would validate the admin role here
  // by checking the Clerk user metadata or maintaining an admin users table
  // For now, we'll implement basic validation

  // Check if the user exists in our system
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", adminClerkId))
    .first();

  if (!user) {
    throw new Error("User not found in system");
  }

  // Note: In a complete implementation, you would also verify the admin role
  // by checking Clerk metadata or a separate admin users table
  // For this implementation, we assume the adminClerkId is validated at the API layer
}

/**
 * Get current user's admin status - used by client-side admin guard
 */
export const getCurrentUserAdminStatus = query({
  args: { clerkId: v.string() },
  returns: v.object({
    isAdmin: v.boolean(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    // Check if user exists in our system
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { isAdmin: false };
    }

    // For now, we'll check if the user has admin role in Clerk metadata
    // In a real implementation, this would integrate with Clerk's user metadata
    // or maintain a separate admin users table

    // Temporary: Check if user email contains "admin" or if they're in a hardcoded list
    // This should be replaced with proper Clerk metadata checking
    const isAdmin =
      user.email === "kenneth.corbett@gmail.com" || // Add your admin email here
      user.email === "admin@underwater-archaeology.com";

    return {
      isAdmin,
      userId: user._id,
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
    // Note: In a real implementation, you would check admin status here
    // For now, we'll return all users for admin management
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
    const limit = args.limit || 50;

    return await ctx.db
      .query("adminLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});
