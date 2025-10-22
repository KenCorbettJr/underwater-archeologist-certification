import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getChallengesByDifficulty = query({
  args: { 
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )
  },
  returns: v.array(v.object({
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
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_difficulty_and_order", (q) => 
        q.eq("difficulty", args.difficulty)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getChallengeById = query({
  args: { challengeId: v.id("challenges") },
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
    return await ctx.db.get(args.challengeId);
  },
});

export const getUserProgress = query({
  args: { 
    userId: v.id("users"),
    challengeId: v.id("challenges")
  },
  returns: v.union(
    v.object({
      _id: v.id("userProgress"),
      _creationTime: v.number(),
      userId: v.id("users"),
      challengeId: v.id("challenges"),
      status: v.union(
        v.literal("not_started"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("failed")
      ),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      attempts: v.number(),
      score: v.optional(v.number()),
      submissionData: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProgress")
      .withIndex("by_user_and_challenge", (q) => 
        q.eq("userId", args.userId).eq("challengeId", args.challengeId)
      )
      .unique();
  },
});