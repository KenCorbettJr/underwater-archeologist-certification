import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create a new artifact identification game session
export const createArtifactGameSession = mutation({
  args: {
    userId: v.id("users"),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    questionCount: v.number(),
    timeLimit: v.optional(v.number()),
    questionTypes: v.array(
      v.union(v.literal("period"), v.literal("culture"), v.literal("category"))
    ),
    artifactIds: v.array(v.id("gameArtifacts")),
  },
  returns: v.id("gameSessions"),
  handler: async (ctx, args) => {
    // Get artifacts for the game
    const artifacts = await Promise.all(
      args.artifactIds.map((id) => ctx.db.get(id))
    );

    const validArtifacts = artifacts.filter(Boolean);
    if (validArtifacts.length === 0) {
      throw new Error("No valid artifacts found for game session");
    }

    // Calculate max score based on difficulty and question count
    const basePoints =
      args.difficulty === "beginner"
        ? 100
        : args.difficulty === "intermediate"
          ? 120
          : 150;
    const maxScore = args.questionCount * basePoints * 1.5; // Include potential bonuses

    // Create game session
    const sessionId = await ctx.db.insert("gameSessions", {
      userId: args.userId,
      gameType: "artifact_identification",
      difficulty: args.difficulty,
      status: "active",
      startTime: Date.now(),
      currentScore: 0,
      maxScore,
      completionPercentage: 0,
      gameData: JSON.stringify({
        questionCount: args.questionCount,
        timeLimit: args.timeLimit || 300,
        questionTypes: args.questionTypes,
        artifacts: validArtifacts.map((a) => ({
          id: a!._id,
          name: a!.name,
          historicalPeriod: a!.historicalPeriod,
          culture: a!.culture,
          category: a!.category,
          imageUrl: a!.imageUrl,
          significance: a!.significance,
        })),
        currentQuestionIndex: 0,
        answers: [],
        questions: [], // Will be populated by game logic
      }),
      actions: [],
    });

    return sessionId;
  },
});

// Submit an answer for the current question
export const submitArtifactAnswer = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    answer: v.string(),
    timeSpent: v.number(),
    questionIndex: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    score: v.number(),
    feedback: v.string(),
    isCorrect: v.boolean(),
    correctAnswer: v.string(),
    timeBonus: v.number(),
    isGameComplete: v.boolean(),
    gameProgress: v.object({
      currentQuestion: v.number(),
      totalQuestions: v.number(),
      score: v.number(),
      maxScore: v.number(),
      accuracy: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Game session is not active");
    }

    // Parse game data
    let gameData: any = {};
    try {
      gameData = JSON.parse(session.gameData);
    } catch (error) {
      throw new Error("Invalid game data");
    }

    const questions = gameData.questions || [];
    const answers = gameData.answers || [];

    if (args.questionIndex >= questions.length) {
      throw new Error("Invalid question index");
    }

    const currentQuestion = questions[args.questionIndex];
    const isCorrect =
      args.answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    // Calculate score
    const basePoints = currentQuestion.points || 100;
    let points = isCorrect ? basePoints : 0;

    // Time bonus calculation
    const timeLimit = currentQuestion.timeLimit || 30;
    let timeBonus = 0;
    if (isCorrect) {
      if (args.timeSpent <= timeLimit * 0.5) {
        timeBonus = 20;
      } else if (args.timeSpent <= timeLimit * 0.75) {
        timeBonus = 14;
      } else if (args.timeSpent <= timeLimit) {
        timeBonus = 6;
      }
    }
    points += timeBonus;

    // Apply difficulty multiplier
    const difficultyMultiplier =
      session.difficulty === "beginner"
        ? 1.0
        : session.difficulty === "intermediate"
          ? 1.2
          : 1.5;
    points = Math.round(points * difficultyMultiplier);

    // Record answer
    const answer = {
      questionIndex: args.questionIndex,
      selectedAnswer: args.answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent: args.timeSpent,
      points,
      timestamp: Date.now(),
    };

    answers.push(answer);

    // Update game state
    const newScore = session.currentScore + points;
    const currentQuestionIndex = args.questionIndex + 1;
    const completionPercentage =
      (currentQuestionIndex / questions.length) * 100;
    const isGameComplete = currentQuestionIndex >= questions.length;

    // Calculate accuracy
    const correctAnswers = answers.filter((a: any) => a.isCorrect).length;
    const accuracy =
      answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0;

    // Update session
    await ctx.db.patch(args.sessionId, {
      currentScore: Math.min(newScore, session.maxScore),
      completionPercentage: Math.round(completionPercentage),
      status: isGameComplete ? "completed" : "active",
      endTime: isGameComplete ? Date.now() : undefined,
      gameData: JSON.stringify({
        ...gameData,
        currentQuestionIndex,
        answers,
        completionPercentage: Math.round(completionPercentage),
      }),
      actions: [
        ...session.actions,
        JSON.stringify({
          id: `action_${Date.now()}`,
          timestamp: Date.now(),
          actionType: "identify_artifact",
          data: {
            questionIndex: args.questionIndex,
            answer: args.answer,
            timeSpent: args.timeSpent,
            isCorrect,
            points,
          },
        }),
      ],
    });

    // Generate feedback
    const artifact = currentQuestion.artifact;
    let feedback = "";
    if (isCorrect) {
      feedback = `Correct! ${artifact.name} is from the ${currentQuestion.correctAnswer}.`;
      if (timeBonus > 0) {
        feedback += ` Time bonus: +${timeBonus} points!`;
      }
      feedback += ` ${artifact.significance}`;
    } else {
      feedback = `Incorrect. ${artifact.name} is from the ${currentQuestion.correctAnswer}, not ${args.answer}. ${artifact.significance}`;
    }

    return {
      success: isCorrect,
      score: points,
      feedback,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      timeBonus,
      isGameComplete,
      gameProgress: {
        currentQuestion: currentQuestionIndex,
        totalQuestions: questions.length,
        score: Math.min(newScore, session.maxScore),
        maxScore: session.maxScore,
        accuracy: Math.round(accuracy),
      },
    };
  },
});

// Generate questions for an artifact game session
export const generateArtifactQuestions = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.array(
    v.object({
      artifact: v.object({
        id: v.id("gameArtifacts"),
        name: v.string(),
        imageUrl: v.string(),
        description: v.string(),
        historicalPeriod: v.string(),
        culture: v.string(),
        category: v.string(),
        significance: v.string(),
      }),
      questionType: v.union(
        v.literal("period"),
        v.literal("culture"),
        v.literal("category")
      ),
      question: v.string(),
      options: v.array(v.string()),
      correctAnswer: v.string(),
      points: v.number(),
      timeLimit: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    // Parse game data
    let gameData: any = {};
    try {
      gameData = JSON.parse(session.gameData);
    } catch (error) {
      throw new Error("Invalid game data");
    }

    const artifacts = gameData.artifacts || [];
    const questionTypes = gameData.questionTypes || ["period"];
    const questionCount = Math.min(
      gameData.questionCount || 10,
      artifacts.length
    );

    // Get all artifacts for generating options
    const allArtifacts = await ctx.db
      .query("gameArtifacts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const questions: Array<{
      artifact: {
        id: Id<"gameArtifacts">;
        name: string;
        imageUrl: string;
        description: string;
        historicalPeriod: string;
        culture: string;
        category: string;
        significance: string;
      };
      questionType: "period" | "culture" | "category";
      question: string;
      options: string[];
      correctAnswer: string;
      points: number;
      timeLimit: number;
    }> = [];

    for (let i = 0; i < questionCount; i++) {
      const artifact = artifacts[i];
      const questionType = questionTypes[i % questionTypes.length];

      let question: string;
      let correctAnswer: string;
      let options: string[];

      switch (questionType) {
        case "period":
          question = "What historical period is this artifact from?";
          correctAnswer = artifact.historicalPeriod;
          options = generatePeriodOptions(artifact, allArtifacts);
          break;

        case "culture":
          question = "Which culture created this artifact?";
          correctAnswer = artifact.culture;
          options = generateCultureOptions(artifact, allArtifacts);
          break;

        case "category":
          question = "What category does this artifact belong to?";
          correctAnswer = artifact.category;
          options = generateCategoryOptions(artifact, allArtifacts);
          break;

        default:
          question = "What historical period is this artifact from?";
          correctAnswer = artifact.historicalPeriod;
          options = generatePeriodOptions(artifact, allArtifacts);
      }

      const basePoints =
        session.difficulty === "beginner"
          ? 100
          : session.difficulty === "intermediate"
            ? 120
            : 150;
      const timeLimit =
        session.difficulty === "beginner"
          ? 45
          : session.difficulty === "intermediate"
            ? 35
            : 25;

      questions.push({
        artifact: {
          id: artifact.id as Id<"gameArtifacts">,
          name: artifact.name,
          imageUrl: artifact.imageUrl,
          description: artifact.description,
          historicalPeriod: artifact.historicalPeriod,
          culture: artifact.culture,
          category: artifact.category,
          significance: artifact.significance,
        },
        questionType,
        question,
        options: shuffleArray(options),
        correctAnswer,
        points: basePoints,
        timeLimit,
      });
    }

    // Update session with generated questions
    await ctx.db.patch(args.sessionId, {
      gameData: JSON.stringify({
        ...gameData,
        questions,
      }),
    });

    return questions;
  },
});

// Get current game session state
export const getArtifactGameSession = query({
  args: { sessionId: v.id("gameSessions") },
  returns: v.union(
    v.object({
      _id: v.id("gameSessions"),
      userId: v.id("users"),
      gameType: v.literal("artifact_identification"),
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
      gameData: v.string(),
      actions: v.array(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.gameType !== "artifact_identification") {
      return null;
    }
    return {
      _id: session._id,
      userId: session.userId,
      gameType: "artifact_identification" as const,
      difficulty: session.difficulty,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      currentScore: session.currentScore,
      maxScore: session.maxScore,
      completionPercentage: session.completionPercentage,
      gameData: session.gameData,
      actions: session.actions,
    };
  },
});

// Get game statistics for a user
export const getArtifactGameStats = query({
  args: { userId: v.id("users") },
  returns: v.object({
    totalGames: v.number(),
    completedGames: v.number(),
    averageScore: v.number(),
    bestScore: v.number(),
    averageAccuracy: v.number(),
    totalTimeSpent: v.number(),
    difficultyBreakdown: v.object({
      beginner: v.number(),
      intermediate: v.number(),
      advanced: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_user_and_game_type", (q) =>
        q.eq("userId", args.userId).eq("gameType", "artifact_identification")
      )
      .collect();

    const completedSessions = sessions.filter((s) => s.status === "completed");

    let totalScore = 0;
    let totalAccuracy = 0;
    let totalTimeSpent = 0;
    let bestScore = 0;

    const difficultyBreakdown = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    for (const session of completedSessions) {
      totalScore += session.currentScore;
      bestScore = Math.max(bestScore, session.currentScore);

      if (session.endTime) {
        totalTimeSpent += session.endTime - session.startTime;
      }

      difficultyBreakdown[session.difficulty]++;

      // Calculate accuracy from game data
      try {
        const gameData = JSON.parse(session.gameData);
        const answers = gameData.answers || [];
        if (answers.length > 0) {
          const correctAnswers = answers.filter((a: any) => a.isCorrect).length;
          const accuracy = (correctAnswers / answers.length) * 100;
          totalAccuracy += accuracy;
        }
      } catch (error) {
        console.error("Error parsing game data:", error);
      }
    }

    const averageScore =
      completedSessions.length > 0 ? totalScore / completedSessions.length : 0;
    const averageAccuracy =
      completedSessions.length > 0
        ? totalAccuracy / completedSessions.length
        : 0;

    return {
      totalGames: sessions.length,
      completedGames: completedSessions.length,
      averageScore: Math.round(averageScore),
      bestScore,
      averageAccuracy: Math.round(averageAccuracy),
      totalTimeSpent: Math.round(totalTimeSpent / 1000), // Convert to seconds
      difficultyBreakdown,
    };
  },
});

// Helper functions

function generatePeriodOptions(artifact: any, allArtifacts: any[]): string[] {
  const correctAnswer = artifact.historicalPeriod;
  const otherPeriods = [
    ...new Set(
      allArtifacts
        .map((a) => a.historicalPeriod)
        .filter((p) => p !== correctAnswer)
    ),
  ];

  const shuffledOthers = shuffleArray(otherPeriods);
  const options = [correctAnswer, ...shuffledOthers.slice(0, 3)];

  // Ensure we have exactly 4 options
  while (options.length < 4) {
    const fallbackPeriods = [
      "Ancient Egyptian",
      "Classical Greek",
      "Roman Empire",
      "Medieval",
      "Renaissance",
      "Industrial Age",
      "Modern Era",
      "Prehistoric",
    ];
    const fallback = fallbackPeriods.find((p) => !options.includes(p));
    if (fallback) options.push(fallback);
  }

  return options.slice(0, 4);
}

function generateCultureOptions(artifact: any, allArtifacts: any[]): string[] {
  const correctAnswer = artifact.culture;
  const otherCultures = [
    ...new Set(
      allArtifacts.map((a) => a.culture).filter((c) => c !== correctAnswer)
    ),
  ];

  const shuffledOthers = shuffleArray(otherCultures);
  const options = [correctAnswer, ...shuffledOthers.slice(0, 3)];

  // Ensure we have exactly 4 options
  while (options.length < 4) {
    const fallbackCultures = [
      "Egyptian",
      "Greek",
      "Roman",
      "Celtic",
      "Viking",
      "Mayan",
      "Aztec",
      "Chinese",
      "Japanese",
      "Persian",
      "Mesopotamian",
    ];
    const fallback = fallbackCultures.find((c) => !options.includes(c));
    if (fallback) options.push(fallback);
  }

  return options.slice(0, 4);
}

function generateCategoryOptions(artifact: any, allArtifacts: any[]): string[] {
  const correctAnswer = artifact.category;
  const otherCategories = [
    ...new Set(
      allArtifacts.map((a) => a.category).filter((c) => c !== correctAnswer)
    ),
  ];

  const shuffledOthers = shuffleArray(otherCategories);
  const options = [correctAnswer, ...shuffledOthers.slice(0, 3)];

  // Ensure we have exactly 4 options
  while (options.length < 4) {
    const fallbackCategories = [
      "Pottery",
      "Tools",
      "Weapons",
      "Jewelry",
      "Religious Items",
      "Household Items",
      "Art Objects",
      "Coins",
      "Textiles",
      "Architecture",
    ];
    const fallback = fallbackCategories.find((c) => !options.includes(c));
    if (fallback) options.push(fallback);
  }

  return options.slice(0, 4);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
