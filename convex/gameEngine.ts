import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Game engine integration functions for processing game actions and scoring

/**
 * Process a game action and update session state
 */
export const processGameAction = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    action: v.object({
      id: v.string(),
      actionType: v.string(),
      data: v.any(),
      timestamp: v.optional(v.number()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    score: v.number(),
    feedback: v.optional(v.string()),
    data: v.optional(v.any()),
    gameState: v.object({
      currentScore: v.number(),
      completionPercentage: v.number(),
      isComplete: v.boolean(),
    }),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Cannot process action for inactive session");
    }

    // Parse current game data
    let gameData: any = {};
    try {
      gameData = JSON.parse(session.gameData);
    } catch (error) {
      console.error("Failed to parse game data:", error);
    }

    // Process action based on game type
    const result = await processActionByGameType(
      session.gameType,
      session.difficulty,
      args.action,
      gameData
    );

    // Update session with new score and game data
    const newScore = session.currentScore + result.score;
    const actionString = JSON.stringify({
      ...args.action,
      timestamp: args.action.timestamp || Date.now(),
      result: {
        success: result.success,
        score: result.score,
        feedback: result.feedback,
      },
    });

    await ctx.db.patch(args.sessionId, {
      currentScore: Math.min(newScore, session.maxScore),
      completionPercentage: result.gameState.completionPercentage,
      gameData: JSON.stringify(result.gameState.gameData || gameData),
      actions: [...session.actions, actionString],
    });

    return {
      success: result.success,
      score: result.score,
      feedback: result.feedback,
      data: result.data,
      gameState: {
        currentScore: Math.min(newScore, session.maxScore),
        completionPercentage: result.gameState.completionPercentage,
        isComplete: result.gameState.isComplete,
      },
    };
  },
});

/**
 * Calculate final score for a completed session
 */
export const calculateFinalScore = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    totalScore: v.number(),
    maxPossibleScore: v.number(),
    percentage: v.number(),
    breakdown: v.any(),
    feedback: v.array(v.string()),
    canProgress: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    // Parse game data and actions
    let gameData: any = {};
    try {
      gameData = JSON.parse(session.gameData);
    } catch (error) {
      console.error("Failed to parse game data:", error);
    }

    const actions = session.actions
      .map((actionStr) => {
        try {
          return JSON.parse(actionStr);
        } catch (error) {
          console.error("Failed to parse action:", error);
          return null;
        }
      })
      .filter(Boolean);

    // Calculate score based on game type
    const scoreResult = await calculateScoreByGameType(
      session.gameType,
      session.difficulty,
      session.currentScore,
      session.maxScore,
      gameData,
      actions
    );

    // Determine if player can progress to next level
    const minScoreForProgression = getMinScoreForProgression(
      session.difficulty
    );
    const canProgress = scoreResult.percentage >= minScoreForProgression;

    return {
      ...scoreResult,
      canProgress,
    };
  },
});

/**
 * Get level progression requirements
 */
export const getLevelProgression = query({
  args: {
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
    currentLevel: v.number(),
  },
  returns: v.object({
    currentLevel: v.number(),
    maxLevel: v.number(),
    minScoreRequired: v.number(),
    difficultyMultiplier: v.number(),
    levelDescription: v.string(),
  }),
  handler: async (ctx, args) => {
    const maxLevels = getMaxLevelsForGameType(args.gameType);
    const minScore = getMinScoreForProgression(args.difficulty);
    const multiplier = getDifficultyMultiplier(args.difficulty);

    return {
      currentLevel: args.currentLevel,
      maxLevel: maxLevels,
      minScoreRequired: minScore,
      difficultyMultiplier: multiplier,
      levelDescription: getLevelDescription(
        args.gameType,
        args.currentLevel,
        args.difficulty
      ),
    };
  },
});

/**
 * Validate game action before processing
 */
export const validateGameAction = query({
  args: {
    sessionId: v.id("gameSessions"),
    action: v.object({
      actionType: v.string(),
      data: v.any(),
    }),
  },
  returns: v.object({
    isValid: v.boolean(),
    errors: v.array(v.string()),
    suggestions: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        isValid: false,
        errors: ["Game session not found"],
        suggestions: [],
      };
    }

    if (session.status !== "active") {
      return {
        isValid: false,
        errors: ["Game session is not active"],
        suggestions: ["Start a new game session"],
      };
    }

    // Parse game data
    let gameData: any = {};
    try {
      gameData = JSON.parse(session.gameData);
    } catch (error) {
      console.error("Failed to parse game data:", error);
    }

    return validateActionByGameType(session.gameType, args.action, gameData);
  },
});

// Helper functions for game-specific processing

async function processActionByGameType(
  gameType: string,
  difficulty: string,
  action: any,
  gameData: any
): Promise<{
  success: boolean;
  score: number;
  feedback?: string;
  data?: any;
  gameState: {
    completionPercentage: number;
    isComplete: boolean;
    gameData?: any;
  };
}> {
  switch (gameType) {
    case "artifact_identification":
      return processArtifactIdentificationAction(action, gameData, difficulty);
    case "excavation_simulation":
      return processExcavationAction(action, gameData, difficulty);
    default:
      return {
        success: false,
        score: 0,
        feedback: "Game type not implemented",
        gameState: {
          completionPercentage: 0,
          isComplete: false,
        },
      };
  }
}

function processArtifactIdentificationAction(
  action: any,
  gameData: any,
  difficulty: string
): {
  success: boolean;
  score: number;
  feedback?: string;
  data?: any;
  gameState: {
    completionPercentage: number;
    isComplete: boolean;
    gameData?: any;
  };
} {
  const { actionType, data } = action;

  if (actionType !== "identify_artifact") {
    return {
      success: false,
      score: 0,
      feedback: "Invalid action type for artifact identification",
      gameState: {
        completionPercentage: gameData.completionPercentage || 0,
        isComplete: false,
      },
    };
  }

  const currentIndex = gameData.currentArtifactIndex || 0;
  const artifacts = gameData.artifacts || [];
  const correctAnswers = gameData.correctAnswers || 0;

  if (currentIndex >= artifacts.length) {
    return {
      success: false,
      score: 0,
      feedback: "No more artifacts to identify",
      gameState: {
        completionPercentage: 100,
        isComplete: true,
      },
    };
  }

  const currentArtifact = artifacts[currentIndex];
  const userAnswer = data.answer?.toLowerCase();
  const correctAnswer = currentArtifact.correctAnswer?.toLowerCase();
  const isCorrect = userAnswer === correctAnswer;

  let score = isCorrect ? 100 : 0;

  // Time bonus calculation
  const timeSpent = data.timeSpent || 0;
  const targetTime = 30; // 30 seconds
  if (isCorrect && timeSpent <= targetTime) {
    const timeBonus = Math.max(
      0,
      20 - Math.floor((timeSpent / targetTime) * 20)
    );
    score += timeBonus;
  }

  // Difficulty multiplier
  const multiplier = getDifficultyMultiplier(difficulty);
  score = Math.round(score * multiplier);

  const newCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers;
  const newIndex = currentIndex + 1;
  const completionPercentage = (newIndex / artifacts.length) * 100;
  const isComplete = newIndex >= artifacts.length;

  const feedback = isCorrect
    ? `Correct! ${currentArtifact.name} is from the ${currentArtifact.correctAnswer} period.`
    : `Incorrect. ${currentArtifact.name} is from the ${currentArtifact.correctAnswer} period.`;

  return {
    success: isCorrect,
    score,
    feedback,
    data: {
      correctAnswer: currentArtifact.correctAnswer,
      userAnswer: data.answer,
      artifactInfo: currentArtifact,
    },
    gameState: {
      completionPercentage: Math.round(completionPercentage),
      isComplete,
      gameData: {
        ...gameData,
        currentArtifactIndex: newIndex,
        correctAnswers: newCorrectAnswers,
        completionPercentage: Math.round(completionPercentage),
      },
    },
  };
}

function processExcavationAction(
  action: any,
  gameData: any,
  difficulty: string
): {
  success: boolean;
  score: number;
  feedback?: string;
  data?: any;
  gameState: {
    completionPercentage: number;
    isComplete: boolean;
    gameData?: any;
  };
} {
  const { actionType, data } = action;

  let score = 0;
  let feedback = "";
  let success = true;

  const excavatedCells = new Set(gameData.excavatedCells || []);
  const discoveredArtifacts = gameData.discoveredArtifacts || [];
  const protocolViolations = gameData.protocolViolations || 0;
  const artifacts = gameData.artifacts || [];

  switch (actionType) {
    case "excavate_cell":
      const { x, y } = data.position;
      const cellKey = `${x},${y}`;

      if (excavatedCells.has(cellKey)) {
        return {
          success: false,
          score: 0,
          feedback: "Cell already excavated",
          gameState: {
            completionPercentage: gameData.completionPercentage || 0,
            isComplete: false,
          },
        };
      }

      excavatedCells.add(cellKey);
      score = 10; // Base excavation score
      feedback = `Excavated cell (${x}, ${y})`;

      // Check for artifacts
      const artifact = artifacts.find(
        (a: any) =>
          a.position.x === x &&
          a.position.y === y &&
          !discoveredArtifacts.includes(a.id)
      );

      if (artifact) {
        discoveredArtifacts.push(artifact.id);
        score += 50;
        feedback += " - Artifact discovered!";
      }

      // Check protocol compliance
      if (!data.properProtocol) {
        gameData.protocolViolations = protocolViolations + 1;
        score = Math.max(0, score - 20);
        feedback += " - Protocol violation";
      }

      break;

    case "document_finding":
      score = 30;
      feedback = "Documentation created";

      const documentation = data.documentation || {};
      const requiredFields = ["position", "depth", "condition", "notes"];
      const completeness =
        requiredFields.filter((field) => documentation[field]).length /
        requiredFields.length;

      score = Math.round(score * completeness);
      if (completeness < 0.5) {
        success = false;
        feedback += " - Incomplete documentation";
      }

      break;

    default:
      return {
        success: false,
        score: 0,
        feedback: "Unknown action type",
        gameState: {
          completionPercentage: gameData.completionPercentage || 0,
          isComplete: false,
        },
      };
  }

  // Apply difficulty multiplier
  const multiplier = getDifficultyMultiplier(difficulty);
  score = Math.round(score * multiplier);

  // Calculate completion
  const totalArtifacts = artifacts.length;
  const completionPercentage =
    totalArtifacts > 0
      ? (discoveredArtifacts.length / totalArtifacts) * 100
      : 0;
  const isComplete = discoveredArtifacts.length >= totalArtifacts;

  return {
    success,
    score,
    feedback,
    gameState: {
      completionPercentage: Math.round(completionPercentage),
      isComplete,
      gameData: {
        ...gameData,
        excavatedCells: Array.from(excavatedCells),
        discoveredArtifacts,
        completionPercentage: Math.round(completionPercentage),
      },
    },
  };
}

async function calculateScoreByGameType(
  gameType: string,
  difficulty: string,
  currentScore: number,
  maxScore: number,
  gameData: any,
  actions: any[]
): Promise<{
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  breakdown: any;
  feedback: string[];
}> {
  const multiplier = getDifficultyMultiplier(difficulty);
  const baseScore = currentScore / multiplier; // Remove multiplier to get base score
  const finalScore = Math.min(currentScore, maxScore);
  const percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

  const feedback: string[] = [];

  if (percentage >= 90) {
    feedback.push("Outstanding performance!");
  } else if (percentage >= 80) {
    feedback.push("Excellent work!");
  } else if (percentage >= 70) {
    feedback.push("Good job!");
  } else if (percentage >= 60) {
    feedback.push("Keep practicing to improve.");
  } else {
    feedback.push("More practice needed.");
  }

  if (multiplier > 1.0) {
    feedback.push(
      `Difficulty bonus applied (${Math.round((multiplier - 1) * 100)}%)`
    );
  }

  // Game-specific feedback
  if (gameType === "artifact_identification") {
    const correctAnswers = gameData.correctAnswers || 0;
    const totalQuestions = gameData.artifacts?.length || 0;
    if (totalQuestions > 0) {
      const accuracy = (correctAnswers / totalQuestions) * 100;
      feedback.push(
        `Accuracy: ${Math.round(accuracy)}% (${correctAnswers}/${totalQuestions})`
      );
    }
  } else if (gameType === "excavation_simulation") {
    const protocolViolations = gameData.protocolViolations || 0;
    if (protocolViolations === 0) {
      feedback.push("Perfect protocol compliance!");
    } else {
      feedback.push(`${protocolViolations} protocol violations`);
    }
  }

  return {
    totalScore: finalScore,
    maxPossibleScore: maxScore,
    percentage: Math.min(percentage, 100),
    breakdown: {
      baseScore: Math.round(baseScore),
      difficultyBonus: Math.round(currentScore - baseScore),
      totalScore: finalScore,
    },
    feedback,
  };
}

function validateActionByGameType(
  gameType: string,
  action: any,
  gameData: any
): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (!action.actionType) {
    errors.push("Action type is required");
    return { isValid: false, errors, suggestions };
  }

  switch (gameType) {
    case "artifact_identification":
      if (action.actionType === "identify_artifact") {
        if (!action.data?.answer) {
          errors.push("Answer is required for artifact identification");
          suggestions.push("Provide your identification of the artifact");
        }
        if (!action.data?.artifactId) {
          errors.push("Artifact ID is required");
        }
      } else {
        errors.push("Invalid action type for artifact identification game");
        suggestions.push("Use 'identify_artifact' action");
      }
      break;

    case "excavation_simulation":
      if (action.actionType === "excavate_cell") {
        if (
          !action.data?.position ||
          typeof action.data.position.x !== "number" ||
          typeof action.data.position.y !== "number"
        ) {
          errors.push("Valid position coordinates are required");
          suggestions.push("Provide x and y coordinates for excavation");
        }
      } else if (action.actionType === "document_finding") {
        if (!action.data?.documentation) {
          errors.push("Documentation data is required");
          suggestions.push("Provide documentation for the finding");
        }
      } else {
        errors.push("Invalid action type for excavation simulation");
        suggestions.push("Use 'excavate_cell' or 'document_finding' actions");
      }
      break;

    default:
      errors.push(`Validation not implemented for game type: ${gameType}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}

// Utility functions

function getDifficultyMultiplier(difficulty: string): number {
  switch (difficulty) {
    case "beginner":
      return 1.0;
    case "intermediate":
      return 1.2;
    case "advanced":
      return 1.5;
    default:
      return 1.0;
  }
}

function getMinScoreForProgression(difficulty: string): number {
  switch (difficulty) {
    case "beginner":
      return 60;
    case "intermediate":
      return 70;
    case "advanced":
      return 80;
    default:
      return 60;
  }
}

function getMaxLevelsForGameType(gameType: string): number {
  const levels: Record<string, number> = {
    artifact_identification: 10,
    excavation_simulation: 8,
    site_documentation: 6,
    historical_timeline: 8,
    conservation_lab: 7,
  };
  return levels[gameType] || 5;
}

function getLevelDescription(
  gameType: string,
  level: number,
  difficulty: string
): string {
  const descriptions: Record<string, Record<string, string[]>> = {
    artifact_identification: {
      beginner: [
        "Basic pottery identification",
        "Simple tools and weapons",
        "Common household items",
        "Basic decorative objects",
        "Elementary cultural artifacts",
      ],
      intermediate: [
        "Complex pottery styles",
        "Advanced tool identification",
        "Religious and ceremonial objects",
        "Trade goods and currency",
        "Architectural elements",
      ],
      advanced: [
        "Rare and unique artifacts",
        "Cross-cultural comparisons",
        "Dating and provenance analysis",
        "Conservation challenges",
        "Research-level identification",
      ],
    },
  };

  const gameDescriptions = descriptions[gameType];
  if (!gameDescriptions) return `Level ${level}`;

  const difficultyDescriptions = gameDescriptions[difficulty];
  if (!difficultyDescriptions) return `Level ${level}`;

  const index = Math.min(level - 1, difficultyDescriptions.length - 1);
  return difficultyDescriptions[index] || `Level ${level}`;
}
