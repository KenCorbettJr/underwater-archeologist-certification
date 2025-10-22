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

  // Game-related tables
  gameSessions: defineTable({
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
    gameData: v.string(), // JSON string for game-specific data
    actions: v.array(v.string()), // JSON strings of game actions
  })
    .index("by_user_and_game_type", ["userId", "gameType"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_game_type_and_difficulty", ["gameType", "difficulty"]),

  gameArtifacts: defineTable({
    name: v.string(),
    description: v.string(),
    historicalPeriod: v.string(),
    culture: v.string(),
    dateRange: v.string(),
    significance: v.string(),
    imageUrl: v.string(),
    modelUrl: v.optional(v.string()),
    discoveryLocation: v.string(),
    conservationNotes: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    category: v.string(),
    isActive: v.boolean(),
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_historical_period", ["historicalPeriod"])
    .index("by_category", ["category"])
    .index("by_culture", ["culture"]),

  excavationSites: defineTable({
    name: v.string(),
    location: v.string(),
    historicalPeriod: v.string(),
    description: v.string(),
    gridWidth: v.number(),
    gridHeight: v.number(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    environmentalConditions: v.string(), // JSON string
    siteArtifacts: v.array(v.string()), // JSON strings of positioned artifacts
    isActive: v.boolean(),
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_historical_period", ["historicalPeriod"]),

  studentProgress: defineTable({
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
    timeSpent: v.number(), // in minutes
    lastPlayed: v.number(),
    achievements: v.array(v.string()), // JSON strings of achievements
  })
    .index("by_user_and_game_type", ["userId", "gameType"])
    .index("by_user", ["userId"]),

  overallProgress: defineTable({
    userId: v.id("users"),
    overallCompletion: v.number(), // percentage 0-100
    certificationStatus: v.union(
      v.literal("not_eligible"),
      v.literal("eligible"),
      v.literal("certified")
    ),
    lastActivity: v.number(),
    totalGameTime: v.number(), // in minutes
    totalScore: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_certification_status", ["certificationStatus"]),

  certificates: defineTable({
    userId: v.id("users"),
    studentName: v.string(),
    certificateType: v.literal("junior_underwater_archaeologist"),
    issueDate: v.number(),
    scores: v.string(), // JSON string of scores by game type
    verificationCode: v.string(),
    digitalSignature: v.string(),
    isValid: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_verification_code", ["verificationCode"])
    .index("by_issue_date", ["issueDate"]),
});
