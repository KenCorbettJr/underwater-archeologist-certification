// Progress calculation engine with real-time capabilities
// Implements completion percentage algorithms and cross-game progress aggregation

import { Id } from "../../convex/_generated/dataModel";
import {
  GameType,
  DifficultyLevel,
  StudentProgress,
  GameProgress,
  CertificationStatus,
  EligibilityStatus,
  ProgressReport,
  Achievement,
} from "../types";

export interface ProgressCalculationConfig {
  // Weighting for different game types in overall progress
  gameWeights: Record<GameType, number>;
  // Minimum levels required for each game type
  minimumLevels: Record<GameType, number>;
  // Score thresholds for certification eligibility
  certificationThresholds: Record<GameType, number>;
  // Achievement definitions
  achievements: AchievementDefinition[];
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  gameType?: GameType;
  criteria: AchievementCriteria;
}

export interface AchievementCriteria {
  type: "score" | "completion" | "time" | "streak" | "perfect_game";
  threshold: number;
  gameType?: GameType;
  difficulty?: DifficultyLevel;
}

export interface ProgressCalculationResult {
  overallCompletion: number;
  gameProgress: Record<GameType, GameProgress>;
  certificationStatus: CertificationStatus;
  newAchievements: Achievement[];
  recommendations: string[];
}

export class ProgressTracker {
  private config: ProgressCalculationConfig;

  constructor(config?: Partial<ProgressCalculationConfig>) {
    this.config = {
      gameWeights: {
        artifact_identification: 0.25,
        excavation_simulation: 0.3,
        site_documentation: 0.2,
        historical_timeline: 0.15,
        conservation_lab: 0.1,
      },
      minimumLevels: {
        artifact_identification: 5,
        excavation_simulation: 4,
        site_documentation: 3,
        historical_timeline: 3,
        conservation_lab: 2,
      },
      certificationThresholds: {
        artifact_identification: 80,
        excavation_simulation: 75,
        site_documentation: 70,
        historical_timeline: 70,
        conservation_lab: 65,
      },
      achievements: this.getDefaultAchievements(),
      ...config,
    };
  }

  /**
   * Calculate real-time progress for a user based on their game sessions
   */
  calculateProgress(
    userId: Id<"users">,
    gameSessions: any[],
    currentProgress?: StudentProgress
  ): ProgressCalculationResult {
    const gameProgress = this.calculateGameProgress(gameSessions);
    const overallCompletion = this.calculateOverallCompletion(gameProgress);
    const certificationStatus = this.calculateCertificationStatus(gameProgress);
    const newAchievements = this.checkForNewAchievements(
      gameProgress,
      currentProgress?.gameProgress || {
        artifact_identification: {
          completedLevels: 0,
          totalLevels: 0,
          bestScore: 0,
          averageScore: 0,
          timeSpent: 0,
          lastPlayed: new Date(0),
          achievements: [],
        },
        excavation_simulation: {
          completedLevels: 0,
          totalLevels: 0,
          bestScore: 0,
          averageScore: 0,
          timeSpent: 0,
          lastPlayed: new Date(0),
          achievements: [],
        },
        site_documentation: {
          completedLevels: 0,
          totalLevels: 0,
          bestScore: 0,
          averageScore: 0,
          timeSpent: 0,
          lastPlayed: new Date(0),
          achievements: [],
        },
        historical_timeline: {
          completedLevels: 0,
          totalLevels: 0,
          bestScore: 0,
          averageScore: 0,
          timeSpent: 0,
          lastPlayed: new Date(0),
          achievements: [],
        },
        conservation_lab: {
          completedLevels: 0,
          totalLevels: 0,
          bestScore: 0,
          averageScore: 0,
          timeSpent: 0,
          lastPlayed: new Date(0),
          achievements: [],
        },
      }
    );
    const recommendations = this.generateRecommendations(gameProgress);

    return {
      overallCompletion,
      gameProgress,
      certificationStatus,
      newAchievements,
      recommendations,
    };
  }

  /**
   * Calculate progress for each individual game type
   */
  private calculateGameProgress(
    gameSessions: any[]
  ): Record<GameType, GameProgress> {
    const gameTypes: GameType[] = [
      "artifact_identification",
      "excavation_simulation",
      "site_documentation",
      "historical_timeline",
      "conservation_lab",
    ];

    const progress: Record<GameType, GameProgress> = {} as Record<
      GameType,
      GameProgress
    >;

    for (const gameType of gameTypes) {
      const sessions = gameSessions.filter(
        (session) =>
          session.gameType === gameType && session.status === "completed"
      );

      if (sessions.length === 0) {
        progress[gameType] = {
          completedLevels: 0,
          totalLevels: this.config.minimumLevels[gameType],
          bestScore: 0,
          averageScore: 0,
          timeSpent: 0,
          lastPlayed: new Date(0),
          achievements: [],
        };
        continue;
      }

      // Calculate metrics
      const scores = sessions.map((s) => (s.currentScore / s.maxScore) * 100);
      const bestScore = Math.max(...scores);
      const averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Calculate time spent (convert from milliseconds to minutes)
      const timeSpent = sessions.reduce((total, session) => {
        if (session.endTime && session.startTime) {
          return total + (session.endTime - session.startTime) / (1000 * 60);
        }
        return total;
      }, 0);

      // Get last played date
      const lastPlayed = new Date(
        Math.max(...sessions.map((s) => s.startTime || 0))
      );

      // Count completed levels (unique difficulty levels completed)
      const completedDifficulties = new Set(
        sessions
          .filter((s) => s.completionPercentage >= 100)
          .map((s) => s.difficulty)
      );

      progress[gameType] = {
        completedLevels: completedDifficulties.size,
        totalLevels: this.config.minimumLevels[gameType],
        bestScore: Math.round(bestScore),
        averageScore: Math.round(averageScore),
        timeSpent: Math.round(timeSpent),
        lastPlayed,
        achievements: [], // Will be populated by achievement checking
      };
    }

    return progress;
  }

  /**
   * Calculate overall completion percentage using weighted game progress
   */
  private calculateOverallCompletion(
    gameProgress: Record<GameType, GameProgress>
  ): number {
    let weightedCompletion = 0;
    let totalWeight = 0;

    for (const [gameType, progress] of Object.entries(gameProgress)) {
      const weight = this.config.gameWeights[gameType as GameType];
      const gameCompletion =
        (progress.completedLevels / progress.totalLevels) * 100;

      weightedCompletion += gameCompletion * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(weightedCompletion / totalWeight) : 0;
  }

  /**
   * Determine certification status based on game progress
   */
  private calculateCertificationStatus(
    gameProgress: Record<GameType, GameProgress>
  ): CertificationStatus {
    const gameTypes: GameType[] = [
      "artifact_identification",
      "excavation_simulation",
      "site_documentation",
      "historical_timeline",
      "conservation_lab",
    ];

    let eligibleGames = 0;
    const requiredGames = gameTypes.length;

    for (const gameType of gameTypes) {
      const progress = gameProgress[gameType];
      const threshold = this.config.certificationThresholds[gameType];

      // Check if minimum levels completed and score threshold met
      const hasMinimumLevels =
        progress.completedLevels >= this.config.minimumLevels[gameType];
      const meetsScoreThreshold = progress.bestScore >= threshold;

      if (hasMinimumLevels && meetsScoreThreshold) {
        eligibleGames++;
      }
    }

    if (eligibleGames === requiredGames) {
      return "eligible";
    } else if (eligibleGames > 0) {
      return "not_eligible";
    } else {
      return "not_eligible";
    }
  }

  /**
   * Check for newly earned achievements
   */
  private checkForNewAchievements(
    currentProgress: Record<GameType, GameProgress>,
    previousProgress: Record<GameType, GameProgress>
  ): Achievement[] {
    const newAchievements: Achievement[] = [];

    for (const achievementDef of this.config.achievements) {
      const isNewlyEarned = this.checkAchievementCriteria(
        achievementDef,
        currentProgress,
        previousProgress
      );

      if (isNewlyEarned) {
        newAchievements.push({
          id: achievementDef.id,
          name: achievementDef.name,
          description: achievementDef.description,
          iconUrl: achievementDef.iconUrl,
          earnedDate: new Date(),
          gameType: achievementDef.gameType,
        });
      }
    }

    return newAchievements;
  }

  /**
   * Check if achievement criteria is met for the first time
   */
  private checkAchievementCriteria(
    achievement: AchievementDefinition,
    currentProgress: Record<GameType, GameProgress>,
    previousProgress: Record<GameType, GameProgress>
  ): boolean {
    const { criteria } = achievement;
    const gameType = criteria.gameType || achievement.gameType;

    if (!gameType) {
      // Overall achievements - check across all games
      return this.checkOverallAchievement(
        criteria,
        currentProgress,
        previousProgress
      );
    }

    const current = currentProgress[gameType];
    const previous = previousProgress[gameType] || {
      completedLevels: 0,
      totalLevels: 0,
      bestScore: 0,
      averageScore: 0,
      timeSpent: 0,
      lastPlayed: new Date(0),
      achievements: [],
    };

    switch (criteria.type) {
      case "score":
        return (
          current.bestScore >= criteria.threshold &&
          previous.bestScore < criteria.threshold
        );

      case "completion":
        return (
          current.completedLevels >= criteria.threshold &&
          previous.completedLevels < criteria.threshold
        );

      case "time":
        return (
          current.timeSpent >= criteria.threshold &&
          previous.timeSpent < criteria.threshold
        );

      default:
        return false;
    }
  }

  /**
   * Check achievements that span across all game types
   */
  private checkOverallAchievement(
    criteria: AchievementCriteria,
    currentProgress: Record<GameType, GameProgress>,
    previousProgress: Record<GameType, GameProgress>
  ): boolean {
    const gameTypes: GameType[] = [
      "artifact_identification",
      "excavation_simulation",
      "site_documentation",
      "historical_timeline",
      "conservation_lab",
    ];

    switch (criteria.type) {
      case "completion": {
        const currentTotal = gameTypes.reduce(
          (sum, gameType) => sum + currentProgress[gameType].completedLevels,
          0
        );
        const previousTotal = gameTypes.reduce(
          (sum, gameType) =>
            sum + (previousProgress[gameType]?.completedLevels || 0),
          0
        );
        return (
          currentTotal >= criteria.threshold &&
          previousTotal < criteria.threshold
        );
      }

      case "score": {
        const currentAvg =
          gameTypes.reduce(
            (sum, gameType) => sum + currentProgress[gameType].bestScore,
            0
          ) / gameTypes.length;
        const previousAvg =
          gameTypes.reduce(
            (sum, gameType) =>
              sum + (previousProgress[gameType]?.bestScore || 0),
            0
          ) / gameTypes.length;
        return (
          currentAvg >= criteria.threshold && previousAvg < criteria.threshold
        );
      }

      default:
        return false;
    }
  }

  /**
   * Generate personalized recommendations based on progress
   */
  private generateRecommendations(
    gameProgress: Record<GameType, GameProgress>
  ): string[] {
    const recommendations: string[] = [];
    const gameTypes: GameType[] = [
      "artifact_identification",
      "excavation_simulation",
      "site_documentation",
      "historical_timeline",
      "conservation_lab",
    ];

    // Find weakest areas
    const gameCompletions = gameTypes.map((gameType) => ({
      gameType,
      completion:
        (gameProgress[gameType].completedLevels /
          gameProgress[gameType].totalLevels) *
        100,
      score: gameProgress[gameType].bestScore,
    }));

    gameCompletions.sort((a, b) => a.completion - b.completion);

    // Recommend focusing on lowest completion games
    const weakestGame = gameCompletions[0];
    if (weakestGame.completion < 50) {
      recommendations.push(
        `Focus on ${this.getGameDisplayName(weakestGame.gameType)} to improve overall progress`
      );
    }

    // Recommend score improvements
    const lowScoreGames = gameCompletions.filter((game) => game.score < 70);
    if (lowScoreGames.length > 0) {
      recommendations.push(
        `Practice ${lowScoreGames.map((g) => this.getGameDisplayName(g.gameType)).join(", ")} to improve scores`
      );
    }

    // Certification readiness
    const eligibleGames = gameTypes.filter((gameType) => {
      const progress = gameProgress[gameType];
      const threshold = this.config.certificationThresholds[gameType];
      return (
        progress.completedLevels >= this.config.minimumLevels[gameType] &&
        progress.bestScore >= threshold
      );
    });

    if (eligibleGames.length === gameTypes.length) {
      recommendations.push(
        "You're ready for certification! Take the final assessment."
      );
    } else if (eligibleGames.length >= 3) {
      recommendations.push(
        "You're close to certification eligibility. Keep practicing!"
      );
    }

    return recommendations;
  }

  /**
   * Get display name for game type
   */
  private getGameDisplayName(gameType: GameType): string {
    const displayNames: Record<GameType, string> = {
      artifact_identification: "Artifact Identification",
      excavation_simulation: "Excavation Simulation",
      site_documentation: "Site Documentation",
      historical_timeline: "Historical Timeline",
      conservation_lab: "Conservation Lab",
    };
    return displayNames[gameType];
  }

  /**
   * Get default achievement definitions
   */
  private getDefaultAchievements(): AchievementDefinition[] {
    return [
      {
        id: "first_artifact",
        name: "First Discovery",
        description: "Complete your first artifact identification game",
        gameType: "artifact_identification",
        criteria: { type: "completion", threshold: 1 },
      },
      {
        id: "artifact_expert",
        name: "Artifact Expert",
        description: "Score 90% or higher in artifact identification",
        gameType: "artifact_identification",
        criteria: { type: "score", threshold: 90 },
      },
      {
        id: "excavation_master",
        name: "Excavation Master",
        description: "Complete all excavation simulation levels",
        gameType: "excavation_simulation",
        criteria: { type: "completion", threshold: 4 },
      },
      {
        id: "documentation_pro",
        name: "Documentation Pro",
        description: "Score 85% or higher in site documentation",
        gameType: "site_documentation",
        criteria: { type: "score", threshold: 85 },
      },
      {
        id: "time_traveler",
        name: "Time Traveler",
        description: "Master the historical timeline challenges",
        gameType: "historical_timeline",
        criteria: { type: "score", threshold: 80 },
      },
      {
        id: "conservator",
        name: "Junior Conservator",
        description: "Complete conservation lab training",
        gameType: "conservation_lab",
        criteria: { type: "completion", threshold: 2 },
      },
      {
        id: "dedicated_learner",
        name: "Dedicated Learner",
        description: "Spend 2 hours learning underwater archaeology",
        criteria: { type: "time", threshold: 120 }, // 120 minutes
      },
      {
        id: "well_rounded",
        name: "Well-Rounded Archaeologist",
        description: "Complete at least one level in all game types",
        criteria: { type: "completion", threshold: 5 }, // Total across all games
      },
    ];
  }

  /**
   * Calculate eligibility status for certification
   */
  calculateEligibilityStatus(
    gameProgress: Record<GameType, GameProgress>
  ): EligibilityStatus {
    const gameTypes: GameType[] = [
      "artifact_identification",
      "excavation_simulation",
      "site_documentation",
      "historical_timeline",
      "conservation_lab",
    ];

    const missingRequirements: string[] = [];
    let totalCompletion = 0;
    let estimatedTime = 0;

    for (const gameType of gameTypes) {
      const progress = gameProgress[gameType];
      const minLevels = this.config.minimumLevels[gameType];
      const threshold = this.config.certificationThresholds[gameType];
      const gameName = this.getGameDisplayName(gameType);

      // Check level completion
      if (progress.completedLevels < minLevels) {
        const remaining = minLevels - progress.completedLevels;
        missingRequirements.push(
          `Complete ${remaining} more ${gameName} level(s)`
        );
        estimatedTime += remaining * 20; // Estimate 20 minutes per level
      }

      // Check score threshold
      if (progress.bestScore < threshold) {
        const scoreGap = threshold - progress.bestScore;
        missingRequirements.push(
          `Improve ${gameName} score by ${scoreGap} points`
        );
        estimatedTime += Math.ceil(scoreGap / 10) * 15; // Estimate improvement time
      }

      // Calculate completion percentage for this game
      const levelCompletion = Math.min(progress.completedLevels / minLevels, 1);
      const scoreCompletion = Math.min(progress.bestScore / threshold, 1);
      const gameCompletion = (levelCompletion + scoreCompletion) / 2;
      totalCompletion += gameCompletion;
    }

    const overallCompletion = (totalCompletion / gameTypes.length) * 100;
    const isEligible = missingRequirements.length === 0;

    return {
      isEligible,
      completionPercentage: Math.round(overallCompletion),
      missingRequirements,
      estimatedTimeToCompletion: estimatedTime > 0 ? estimatedTime : undefined,
    };
  }
}

// Export singleton instance with default configuration
export const progressTracker = new ProgressTracker();
