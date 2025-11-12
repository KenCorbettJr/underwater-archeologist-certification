import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Schema for certification attempts tracking
 */
const certificationAttemptSchema = v.object({
  userId: v.id("users"),
  attemptDate: v.number(),
  overallScore: v.number(),
  gameScores: v.string(), // JSON string
  passed: v.boolean(),
  feedback: v.array(v.string()),
});

/**
 * Record a certification attempt
 */
export const recordCertificationAttempt = mutation({
  args: {
    userId: v.id("users"),
    overallScore: v.number(),
    gameScores: v.string(),
    passed: v.boolean(),
    feedback: v.array(v.string()),
  },
  returns: v.object({
    attemptId: v.string(),
    nextRetestDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const attemptDate = Date.now();

    // Store attempt in progress history with special marker
    const attemptId = await ctx.db.insert("progressHistory", {
      userId: args.userId,
      timestamp: attemptDate,
      gameType: "artifact_identification", // Use as default for certification attempts
      completedLevels: 0,
      totalLevels: 0,
      score: args.overallScore,
      timeSpent: 0,
      overallCompletion: args.overallScore,
      snapshotData: JSON.stringify({
        type: "certification_attempt",
        passed: args.passed,
        gameScores: args.gameScores,
        feedback: args.feedback,
      }),
    });

    // Calculate next retest date (48 hours from now if failed)
    const nextRetestDate = args.passed
      ? undefined
      : attemptDate + 48 * 60 * 60 * 1000;

    return {
      attemptId: attemptId,
      nextRetestDate,
    };
  },
});

/**
 * Get certification attempt history for a user
 */
export const getCertificationAttempts = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("progressHistory"),
      attemptDate: v.number(),
      overallScore: v.number(),
      gameScores: v.string(),
      passed: v.boolean(),
      feedback: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("progressHistory")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter for certification attempts
    const attempts = history
      .filter((h) => {
        try {
          const data = JSON.parse(h.snapshotData);
          return data.type === "certification_attempt";
        } catch {
          return false;
        }
      })
      .map((h) => {
        const data = JSON.parse(h.snapshotData);
        return {
          _id: h._id,
          attemptDate: h.timestamp,
          overallScore: h.score,
          gameScores: data.gameScores,
          passed: data.passed,
          feedback: data.feedback,
        };
      })
      .sort((a, b) => b.attemptDate - a.attemptDate);

    return attempts;
  },
});

/**
 * Check if user can retest for certification
 */
export const canRetest = query({
  args: { userId: v.id("users") },
  returns: v.object({
    canRetest: v.boolean(),
    nextRetestDate: v.optional(v.number()),
    hoursRemaining: v.optional(v.number()),
    attemptCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("progressHistory")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter for failed certification attempts
    const failedAttempts = attempts.filter((h) => {
      try {
        const data = JSON.parse(h.snapshotData);
        return data.type === "certification_attempt" && !data.passed;
      } catch {
        return false;
      }
    });

    if (failedAttempts.length === 0) {
      return {
        canRetest: true,
        attemptCount: 0,
      };
    }

    // Get most recent failed attempt
    const lastAttempt = failedAttempts.sort(
      (a, b) => b.timestamp - a.timestamp
    )[0];
    const nextRetestDate = lastAttempt.timestamp + 48 * 60 * 60 * 1000; // 48 hours
    const now = Date.now();

    const canRetest = now >= nextRetestDate;
    const hoursRemaining = canRetest
      ? undefined
      : Math.ceil((nextRetestDate - now) / (60 * 60 * 1000));

    return {
      canRetest,
      nextRetestDate: canRetest ? undefined : nextRetestDate,
      hoursRemaining,
      attemptCount: failedAttempts.length,
    };
  },
});

/**
 * Generate a personalized remediation plan
 */
export const generateRemediationPlan = query({
  args: { userId: v.id("users") },
  returns: v.object({
    userId: v.id("users"),
    weakAreas: v.array(v.string()),
    recommendedActivities: v.array(
      v.object({
        gameType: v.string(),
        difficulty: v.string(),
        description: v.string(),
        estimatedTime: v.number(),
        priority: v.string(),
      })
    ),
    estimatedCompletionTime: v.number(),
    retestEligibleDate: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get game progress
    const gameProgress = await ctx.db
      .query("studentProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Define certification requirements
    const requirements = [
      {
        gameType: "artifact_identification",
        requiredScore: 80,
        name: "Artifact Identification",
      },
      {
        gameType: "excavation_simulation",
        requiredScore: 75,
        name: "Excavation Techniques",
      },
    ];

    const weakAreas: string[] = [];
    const recommendedActivities: Array<{
      gameType: string;
      difficulty: string;
      description: string;
      estimatedTime: number;
      priority: string;
    }> = [];

    let totalEstimatedTime = 0;

    for (const req of requirements) {
      const progress = gameProgress.find((p) => p.gameType === req.gameType);
      const currentScore = progress?.bestScore || 0;

      if (currentScore < req.requiredScore) {
        weakAreas.push(req.name);

        const scoreGap = req.requiredScore - currentScore;
        const priority =
          scoreGap > 20 ? "high" : scoreGap > 10 ? "medium" : "low";

        // Recommend appropriate difficulty level
        let difficulty = "beginner";
        if (currentScore >= 60) {
          difficulty = "intermediate";
        }
        if (currentScore >= 70) {
          difficulty = "advanced";
        }

        const estimatedTime = Math.ceil(scoreGap * 2); // 2 minutes per percentage point

        recommendedActivities.push({
          gameType: req.gameType,
          difficulty,
          description: `Practice ${req.name} at ${difficulty} level to improve your score from ${currentScore}% to ${req.requiredScore}%`,
          estimatedTime,
          priority,
        });

        totalEstimatedTime += estimatedTime;
      }
    }

    // Sort activities by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendedActivities.sort(
      (a, b) =>
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder]
    );

    // Calculate retest eligible date (48 hours from now)
    const retestEligibleDate = Date.now() + 48 * 60 * 60 * 1000;

    return {
      userId: args.userId,
      weakAreas,
      recommendedActivities,
      estimatedCompletionTime: totalEstimatedTime,
      retestEligibleDate,
    };
  },
});

/**
 * Get detailed feedback for failed certification attempt
 */
export const getDetailedFeedback = query({
  args: { userId: v.id("users") },
  returns: v.object({
    hasAttempts: v.boolean(),
    lastAttempt: v.union(
      v.object({
        attemptDate: v.number(),
        overallScore: v.number(),
        passed: v.boolean(),
        gameScores: v.record(v.string(), v.number()),
        strengths: v.array(v.string()),
        weaknesses: v.array(v.string()),
        specificFeedback: v.array(v.string()),
        improvementTips: v.array(v.string()),
      }),
      v.null()
    ),
  }),
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("progressHistory")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter for certification attempts
    const certAttempts = attempts.filter((h) => {
      try {
        const data = JSON.parse(h.snapshotData);
        return data.type === "certification_attempt";
      } catch {
        return false;
      }
    });

    if (certAttempts.length === 0) {
      return {
        hasAttempts: false,
        lastAttempt: null,
      };
    }

    // Get most recent attempt
    const lastAttempt = certAttempts.sort(
      (a, b) => b.timestamp - a.timestamp
    )[0];
    const attemptData = JSON.parse(lastAttempt.snapshotData);
    const gameScores = JSON.parse(attemptData.gameScores);

    // Analyze performance
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const specificFeedback: string[] = [];
    const improvementTips: string[] = [];

    const requirements = [
      {
        gameType: "artifact_identification",
        requiredScore: 80,
        name: "Artifact Identification",
      },
      {
        gameType: "excavation_simulation",
        requiredScore: 75,
        name: "Excavation Techniques",
      },
    ];

    for (const req of requirements) {
      const score = gameScores[req.gameType] || 0;

      if (score >= req.requiredScore) {
        strengths.push(
          `Strong performance in ${req.name} (${score}% - exceeds ${req.requiredScore}% requirement)`
        );
      } else {
        const gap = req.requiredScore - score;
        weaknesses.push(
          `${req.name} needs improvement (${score}% - ${gap}% below requirement)`
        );

        specificFeedback.push(
          `In ${req.name}, you scored ${score}%. You need to improve by ${gap}% to meet the ${req.requiredScore}% requirement.`
        );

        // Provide specific tips based on game type
        if (req.gameType === "artifact_identification") {
          improvementTips.push(
            "Study artifact characteristics from different historical periods"
          );
          improvementTips.push(
            "Practice identifying artifacts by their cultural context"
          );
          improvementTips.push(
            "Review the significance and discovery stories of key artifacts"
          );
        } else if (req.gameType === "excavation_simulation") {
          improvementTips.push(
            "Focus on proper archaeological documentation techniques"
          );
          improvementTips.push(
            "Practice using the correct tools for different excavation scenarios"
          );
          improvementTips.push(
            "Review excavation protocols and avoid common violations"
          );
        }
      }
    }

    return {
      hasAttempts: true,
      lastAttempt: {
        attemptDate: lastAttempt.timestamp,
        overallScore: lastAttempt.score,
        passed: attemptData.passed,
        gameScores,
        strengths,
        weaknesses,
        specificFeedback,
        improvementTips,
      },
    };
  },
});

/**
 * Mark remediation activities as completed
 */
export const completeRemediationActivity = mutation({
  args: {
    userId: v.id("users"),
    gameType: v.union(
      v.literal("artifact_identification"),
      v.literal("excavation_simulation"),
      v.literal("site_documentation"),
      v.literal("historical_timeline"),
      v.literal("conservation_lab")
    ),
    score: v.number(),
    timeSpent: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    readyForRetest: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Update game progress
    const existingProgress = await ctx.db
      .query("studentProgress")
      .withIndex("by_user_and_game_type", (q) =>
        q.eq("userId", args.userId).eq("gameType", args.gameType)
      )
      .first();

    if (existingProgress) {
      const newBestScore = Math.max(existingProgress.bestScore, args.score);
      const newAverageScore =
        (existingProgress.averageScore * existingProgress.completedLevels +
          args.score) /
        (existingProgress.completedLevels + 1);

      await ctx.db.patch(existingProgress._id, {
        bestScore: newBestScore,
        averageScore: newAverageScore,
        completedLevels: existingProgress.completedLevels + 1,
        timeSpent: existingProgress.timeSpent + args.timeSpent,
        lastPlayed: Date.now(),
      });
    }

    // Check if user is now ready for retest
    const gameProgress = await ctx.db
      .query("studentProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const requirements = [
      { gameType: "artifact_identification", requiredScore: 80 },
      { gameType: "excavation_simulation", requiredScore: 75 },
    ];

    const readyForRetest = requirements.every((req) => {
      const progress = gameProgress.find((p) => p.gameType === req.gameType);
      return progress && progress.bestScore >= req.requiredScore;
    });

    return {
      success: true,
      message: `Remediation activity completed. Score: ${args.score}%`,
      readyForRetest,
    };
  },
});
