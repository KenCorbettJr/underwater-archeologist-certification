// Utility functions for game data transformation and helpers

import {
  GameType,
  DifficultyLevel,
  GameSession,
  StudentProgress,
  DigitalCertificate,
} from "../types";

// Game Configuration Constants
export const GAME_CONFIG = {
  // Score thresholds for certification
  CERTIFICATION_THRESHOLDS: {
    artifact_identification: 80,
    excavation_simulation: 75,
    site_documentation: 70,
    historical_timeline: 70,
    conservation_lab: 70,
  },

  // Overall completion requirements
  OVERALL_COMPLETION_FOR_ELIGIBILITY: 80,
  OVERALL_COMPLETION_FOR_CERTIFICATION: 85,

  // Session timeouts (in minutes)
  SESSION_TIMEOUT: 45,
  MAX_SESSION_TIME: 120,

  // Progress tracking
  LEVELS_PER_GAME: {
    artifact_identification: 10,
    excavation_simulation: 8,
    site_documentation: 6,
    historical_timeline: 8,
    conservation_lab: 7,
  },

  // Retry and cooldown periods
  CERTIFICATION_RETRY_COOLDOWN_HOURS: 48,
  MAX_CERTIFICATION_ATTEMPTS: 3,
} as const;

// Game Type Display Names
export const GAME_DISPLAY_NAMES: Record<GameType, string> = {
  artifact_identification: "Artifact Identification",
  excavation_simulation: "Excavation Simulation",
  site_documentation: "Site Documentation",
  historical_timeline: "Historical Timeline",
  conservation_lab: "Conservation Lab",
};

// Difficulty Display Names
export const DIFFICULTY_DISPLAY_NAMES: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Data Transformation Functions

/**
 * Convert database JSON strings to typed objects
 */
export function parseGameData<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Failed to parse game data:", error);
    return fallback;
  }
}

/**
 * Convert typed objects to JSON strings for database storage
 */
export function stringifyGameData(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Failed to stringify game data:", error);
    return "{}";
  }
}

/**
 * Calculate completion percentage based on completed vs total levels
 */
export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/**
 * Calculate overall progress across all game types
 */
export function calculateOverallProgress(
  gameProgress: Record<
    GameType,
    { completedLevels: number; totalLevels: number }
  >
): number {
  const gameTypes = Object.keys(GAME_CONFIG.LEVELS_PER_GAME) as GameType[];
  let totalCompleted = 0;
  let totalPossible = 0;

  for (const gameType of gameTypes) {
    const progress = gameProgress[gameType];
    if (progress) {
      totalCompleted += progress.completedLevels;
      totalPossible += progress.totalLevels;
    } else {
      totalPossible += GAME_CONFIG.LEVELS_PER_GAME[gameType];
    }
  }

  return calculateCompletionPercentage(totalCompleted, totalPossible);
}

/**
 * Check if user is eligible for certification
 */
export function checkCertificationEligibility(
  gameScores: Record<GameType, number>,
  overallCompletion: number
): { isEligible: boolean; missingRequirements: string[] } {
  const missingRequirements: string[] = [];

  // Check overall completion
  if (overallCompletion < GAME_CONFIG.OVERALL_COMPLETION_FOR_ELIGIBILITY) {
    missingRequirements.push(
      `Overall completion must be at least ${GAME_CONFIG.OVERALL_COMPLETION_FOR_ELIGIBILITY}% (currently ${overallCompletion}%)`
    );
  }

  // Check individual game scores
  for (const [gameType, requiredScore] of Object.entries(
    GAME_CONFIG.CERTIFICATION_THRESHOLDS
  )) {
    const actualScore = gameScores[gameType as GameType] || 0;
    if (actualScore < requiredScore) {
      missingRequirements.push(
        `${GAME_DISPLAY_NAMES[gameType as GameType]} score must be at least ${requiredScore}% (currently ${actualScore}%)`
      );
    }
  }

  return {
    isEligible: missingRequirements.length === 0,
    missingRequirements,
  };
}

/**
 * Generate a unique verification code for certificates
 */
export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate average score from an array of scores
 */
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

/**
 * Format time duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get difficulty color for UI display
 */
export function getDifficultyColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case "beginner":
      return "text-green-600 bg-green-100";
    case "intermediate":
      return "text-yellow-600 bg-yellow-100";
    case "advanced":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

/**
 * Get game type icon for UI display
 */
export function getGameTypeIcon(gameType: GameType): string {
  switch (gameType) {
    case "artifact_identification":
      return "🏺";
    case "excavation_simulation":
      return "⛏️";
    case "site_documentation":
      return "📋";
    case "historical_timeline":
      return "📅";
    case "conservation_lab":
      return "🔬";
    default:
      return "🎮";
  }
}

/**
 * Validate session timeout
 */
export function isSessionExpired(
  startTime: Date,
  currentTime: Date = new Date()
): boolean {
  const elapsedMinutes =
    (currentTime.getTime() - startTime.getTime()) / (1000 * 60);
  return elapsedMinutes > GAME_CONFIG.SESSION_TIMEOUT;
}

/**
 * Calculate estimated time to completion based on current progress
 */
export function estimateTimeToCompletion(
  currentProgress: number,
  averageTimePerLevel: number = 5
): number {
  const remainingProgress = 100 - currentProgress;
  const remainingLevels =
    (remainingProgress / 100) *
    Object.values(GAME_CONFIG.LEVELS_PER_GAME).reduce((a, b) => a + b, 0);
  return Math.ceil(remainingLevels * averageTimePerLevel);
}

/**
 * Generate achievement based on game performance
 */
export function generateAchievements(
  gameType: GameType,
  score: number,
  timeSpent: number,
  difficulty: DifficultyLevel
): Array<{ id: string; name: string; description: string }> {
  const achievements = [];

  // Perfect score achievement
  if (score >= 100) {
    achievements.push({
      id: `perfect_${gameType}`,
      name: "Perfect Score",
      description: `Achieved a perfect score in ${GAME_DISPLAY_NAMES[gameType]}`,
    });
  }

  // Speed achievement
  if (timeSpent <= 10 && score >= 80) {
    achievements.push({
      id: `speed_${gameType}`,
      name: "Speed Demon",
      description: `Completed ${GAME_DISPLAY_NAMES[gameType]} quickly with high accuracy`,
    });
  }

  // Difficulty achievement
  if (difficulty === "advanced" && score >= 85) {
    achievements.push({
      id: `master_${gameType}`,
      name: "Master Archaeologist",
      description: `Excelled in advanced ${GAME_DISPLAY_NAMES[gameType]}`,
    });
  }

  return achievements;
}

/**
 * Sort game types by recommended learning order
 */
export function getRecommendedGameOrder(): GameType[] {
  return [
    "artifact_identification",
    "historical_timeline",
    "excavation_simulation",
    "site_documentation",
    "conservation_lab",
  ];
}

/**
 * Get next recommended game based on current progress
 */
export function getNextRecommendedGame(
  gameProgress: Record<
    GameType,
    { completedLevels: number; totalLevels: number }
  >
): GameType | null {
  const recommendedOrder = getRecommendedGameOrder();

  for (const gameType of recommendedOrder) {
    const progress = gameProgress[gameType];
    if (!progress || progress.completedLevels < progress.totalLevels) {
      return gameType;
    }
  }

  return null; // All games completed
}

/**
 * Calculate learning analytics for progress reports
 */
export function calculateLearningAnalytics(studentProgress: StudentProgress) {
  const gameTypes = Object.keys(GAME_CONFIG.LEVELS_PER_GAME) as GameType[];
  const analytics = {
    totalTimeSpent: 0,
    averageScore: 0,
    strongestArea: null as GameType | null,
    weakestArea: null as GameType | null,
    consistencyScore: 0,
  };

  let totalScore = 0;
  let gameCount = 0;
  let highestScore = 0;
  let lowestScore = 100;
  const scores: number[] = [];

  for (const gameType of gameTypes) {
    const progress = studentProgress.gameProgress[gameType];
    if (progress && progress.completedLevels > 0) {
      analytics.totalTimeSpent += progress.timeSpent;
      totalScore += progress.averageScore;
      gameCount++;
      scores.push(progress.averageScore);

      if (progress.averageScore > highestScore) {
        highestScore = progress.averageScore;
        analytics.strongestArea = gameType;
      }

      if (progress.averageScore < lowestScore) {
        lowestScore = progress.averageScore;
        analytics.weakestArea = gameType;
      }
    }
  }

  if (gameCount > 0) {
    analytics.averageScore = totalScore / gameCount;

    // Calculate consistency (lower standard deviation = higher consistency)
    const mean = analytics.averageScore;
    const variance =
      scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) /
      scores.length;
    const standardDeviation = Math.sqrt(variance);
    analytics.consistencyScore = Math.max(0, 100 - standardDeviation);
  }

  return analytics;
}
