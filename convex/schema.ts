import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
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
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_certification_level", ["certificationLevel"]),

  challenges: defineTable({
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
    content: v.string(), // Rich content/instructions
    requiredLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    isActive: v.boolean(),
    order: v.number(),
  })
    .index("by_category_and_difficulty", ["category", "difficulty"])
    .index("by_difficulty_and_order", ["difficulty", "order"]),

  userProgress: defineTable({
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
    submissionData: v.optional(v.string()), // JSON string of submission
  })
    .index("by_user_and_challenge", ["userId", "challengeId"])
    .index("by_user_and_status", ["userId", "status"]),

  artifacts: defineTable({
    name: v.string(),
    description: v.string(),
    period: v.string(), // Historical period
    location: v.string(), // Where it was found
    imageUrl: v.optional(v.string()),
    category: v.string(),
    significance: v.string(),
    discoveryStory: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_period", ["period"]),

  lessons: defineTable({
    title: v.string(),
    content: v.string(), // Rich content
    category: v.union(
      v.literal("introduction"),
      v.literal("techniques"),
      v.literal("tools"),
      v.literal("history"),
      v.literal("conservation"),
      v.literal("ethics")
    ),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    estimatedMinutes: v.number(),
    prerequisites: v.array(v.id("lessons")),
    isActive: v.boolean(),
    order: v.number(),
  })
    .index("by_category_and_order", ["category", "order"])
    .index("by_difficulty", ["difficulty"]),
});