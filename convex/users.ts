import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    age: v.optional(v.number()),
    school: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      age: args.age,
      school: args.school,
      certificationLevel: "beginner",
      completedChallenges: [],
      totalPoints: 0,
      createdAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  returns: v.union(
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
      completedChallenges: v.array(v.id("challenges")),
      totalPoints: v.number(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const updateUserProgress = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    points: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Add challenge to completed list if not already there
    const completedChallenges = user.completedChallenges.includes(args.challengeId)
      ? user.completedChallenges
      : [...user.completedChallenges, args.challengeId];

    // Update user with new points and completed challenge
    await ctx.db.patch(args.userId, {
      completedChallenges,
      totalPoints: user.totalPoints + args.points,
    });

    // Check if user should level up
    const newTotalPoints = user.totalPoints + args.points;
    let newLevel = user.certificationLevel;

    if (newTotalPoints >= 1000 && user.certificationLevel === "beginner") {
      newLevel = "intermediate";
    } else if (newTotalPoints >= 2500 && user.certificationLevel === "intermediate") {
      newLevel = "advanced";
    } else if (newTotalPoints >= 5000 && user.certificationLevel === "advanced") {
      newLevel = "certified";
    }

    if (newLevel !== user.certificationLevel) {
      await ctx.db.patch(args.userId, {
        certificationLevel: newLevel,
      });
    }

    return null;
  },
});