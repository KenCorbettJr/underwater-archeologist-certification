// Core game engine functionality for underwater archaeology games

import {
  GameType,
  DifficultyLevel,
  GameAction,
  ActionResult,
  ScoreResult,
  CompletionStatus,
} from "../types";
import { GAME_CONFIG } from "./gameUtils";

// Base GameEngine class with common game logic
export abstract class GameEngine {
  protected gameType: GameType;
  protected difficulty: DifficultyLevel;
  protected maxScore: number;
  protected currentScore: number;
  protected actions: GameAction[];
  protected gameData: Record<string, any>;

  constructor(
    gameType: GameType,
    difficulty: DifficultyLevel,
    maxScore: number,
    initialGameData: Record<string, any> = {}
  ) {
    this.gameType = gameType;
    this.difficulty = difficulty;
    this.maxScore = maxScore;
    this.currentScore = 0;
    this.actions = [];
    this.gameData = { ...initialGameData };
  }

  // Abstract methods that must be implemented by specific game engines
  abstract validateAction(action: GameAction): boolean;
  abstract processAction(action: GameAction): ActionResult;
  abstract calculateLevelScore(): number;
  abstract getCompletionStatus(): CompletionStatus;

  // Common scoring algorithms
  protected calculateAccuracyScore(
    correctAnswers: number,
    totalQuestions: number,
    basePoints: number = 100
  ): number {
    if (totalQuestions === 0) return 0;
    const accuracy = correctAnswers / totalQuestions;
    return Math.round(accuracy * basePoints);
  }

  protected calculateTimeBonus(
    timeSpentSeconds: number,
    targetTimeSeconds: number,
    maxBonus: number = 20
  ): number {
    if (timeSpentSeconds <= 0 || targetTimeSeconds <= 0) return 0;

    if (timeSpentSeconds <= targetTimeSeconds) {
      // Perfect time or better gets full bonus
      return maxBonus;
    } else if (timeSpentSeconds <= targetTimeSeconds * 1.5) {
      // Up to 50% overtime gets partial bonus
      const overtime = timeSpentSeconds - targetTimeSeconds;
      const maxOvertime = targetTimeSeconds * 0.5;
      const bonusReduction = (overtime / maxOvertime) * maxBonus;
      return Math.max(0, Math.round(maxBonus - bonusReduction));
    }

    return 0; // No bonus for excessive overtime
  }

  protected calculateDifficultyMultiplier(): number {
    switch (this.difficulty) {
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

  // Level progression system
  protected calculateLevelProgression(
    currentLevel: number,
    scorePercentage: number
  ): { nextLevel: number; canProgress: boolean; feedback: string } {
    const minScoreForProgression = this.getMinScoreForProgression();
    const canProgress = scorePercentage >= minScoreForProgression;

    let feedback = "";
    if (canProgress) {
      if (scorePercentage >= 90) {
        feedback = "Excellent work! You've mastered this level.";
      } else if (scorePercentage >= 80) {
        feedback = "Great job! You can advance to the next level.";
      } else {
        feedback = "Good work! You meet the requirements to continue.";
      }
    } else {
      feedback = `You need at least ${minScoreForProgression}% to advance. Keep practicing!`;
    }

    return {
      nextLevel: canProgress ? currentLevel + 1 : currentLevel,
      canProgress,
      feedback,
    };
  }

  protected getMinScoreForProgression(): number {
    switch (this.difficulty) {
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

  // Action validation and result processing
  public executeAction(action: GameAction): ActionResult {
    // Validate action first
    if (!this.validateAction(action)) {
      return {
        success: false,
        score: 0,
        feedback: "Invalid action",
        data: { error: "Action validation failed" },
      };
    }

    // Process the action
    const result = this.processAction(action);

    // Update game state
    action.result = result;
    this.actions.push(action);

    if (result.success) {
      this.currentScore += result.score;
      this.currentScore = Math.min(this.currentScore, this.maxScore);
    }

    return result;
  }

  // Get current game state
  public getGameState(): {
    gameType: GameType;
    difficulty: DifficultyLevel;
    currentScore: number;
    maxScore: number;
    completionPercentage: number;
    actionCount: number;
    gameData: Record<string, any>;
  } {
    const completion = this.getCompletionStatus();

    return {
      gameType: this.gameType,
      difficulty: this.difficulty,
      currentScore: this.currentScore,
      maxScore: this.maxScore,
      completionPercentage: completion.completionPercentage,
      actionCount: this.actions.length,
      gameData: { ...this.gameData },
    };
  }

  // Calculate final score with all bonuses and multipliers
  public calculateFinalScore(): ScoreResult {
    const baseScore = this.calculateLevelScore();
    const difficultyMultiplier = this.calculateDifficultyMultiplier();
    const finalScore = Math.round(baseScore * difficultyMultiplier);

    const percentage =
      this.maxScore > 0 ? (finalScore / this.maxScore) * 100 : 0;

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

    if (difficultyMultiplier > 1.0) {
      feedback.push(
        `Difficulty bonus applied (${Math.round((difficultyMultiplier - 1) * 100)}%)`
      );
    }

    return {
      totalScore: Math.min(finalScore, this.maxScore),
      maxPossibleScore: this.maxScore,
      percentage: Math.min(percentage, 100),
      breakdown: this.getScoreBreakdown(),
      feedback,
    };
  }

  protected getScoreBreakdown(): Record<string, number> {
    return {
      baseScore: this.calculateLevelScore(),
      difficultyBonus: Math.round(
        this.calculateLevelScore() * (this.calculateDifficultyMultiplier() - 1)
      ),
      totalScore: this.currentScore,
    };
  }

  // Update game data
  public updateGameData(updates: Record<string, any>): void {
    this.gameData = { ...this.gameData, ...updates };
  }

  // Get action history
  public getActionHistory(): GameAction[] {
    return [...this.actions];
  }

  // Reset game state
  public reset(): void {
    this.currentScore = 0;
    this.actions = [];
    this.gameData = {};
  }
}

// Artifact Identification Game Engine
export class ArtifactIdentificationEngine extends GameEngine {
  private artifacts: Array<{
    id: string;
    name: string;
    period: string;
    culture: string;
    correctAnswer: string;
  }>;
  private currentArtifactIndex: number;
  private correctAnswers: number;
  private totalQuestions: number;

  constructor(
    difficulty: DifficultyLevel,
    artifacts: Array<{
      id: string;
      name: string;
      period: string;
      culture: string;
      correctAnswer: string;
    }>
  ) {
    const maxScore = artifacts.length * 100;
    super("artifact_identification", difficulty, maxScore, {
      artifacts,
      currentArtifactIndex: 0,
      correctAnswers: 0,
      totalQuestions: artifacts.length,
    });

    this.artifacts = artifacts;
    this.currentArtifactIndex = 0;
    this.correctAnswers = 0;
    this.totalQuestions = artifacts.length;
  }

  validateAction(action: GameAction): boolean {
    if (action.actionType !== "identify_artifact") return false;
    if (!action.data.artifactId || !action.data.answer) return false;
    if (this.currentArtifactIndex >= this.artifacts.length) return false;

    const currentArtifact = this.artifacts[this.currentArtifactIndex];
    return action.data.artifactId === currentArtifact.id;
  }

  processAction(action: GameAction): ActionResult {
    const currentArtifact = this.artifacts[this.currentArtifactIndex];
    const userAnswer = action.data.answer;
    const correctAnswer = currentArtifact.correctAnswer;
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      this.correctAnswers++;
    }

    this.currentArtifactIndex++;

    const score = isCorrect ? 100 : 0;
    const timeBonus = this.calculateTimeBonus(
      action.data.timeSpent || 0,
      30, // 30 seconds target time
      20 // 20 point bonus
    );

    const totalScore = score + timeBonus;

    return {
      success: isCorrect,
      score: totalScore,
      feedback: isCorrect
        ? `Correct! ${currentArtifact.name} is from the ${correctAnswer} period.`
        : `Incorrect. ${currentArtifact.name} is from the ${correctAnswer} period, not ${userAnswer}.`,
      data: {
        correctAnswer,
        userAnswer,
        timeBonus,
        artifactInfo: {
          name: currentArtifact.name,
          period: currentArtifact.period,
          culture: currentArtifact.culture,
        },
      },
    };
  }

  calculateLevelScore(): number {
    return this.calculateAccuracyScore(
      this.correctAnswers,
      this.totalQuestions,
      this.maxScore
    );
  }

  getCompletionStatus(): CompletionStatus {
    const isComplete = this.currentArtifactIndex >= this.artifacts.length;
    const completionPercentage =
      (this.currentArtifactIndex / this.artifacts.length) * 100;

    let nextObjective: string | undefined;
    const remainingTasks: string[] = [];

    if (!isComplete) {
      const remaining = this.artifacts.length - this.currentArtifactIndex;
      nextObjective = `Identify the next artifact (${remaining} remaining)`;
      remainingTasks.push(`Identify ${remaining} more artifacts`);
    }

    return {
      isComplete,
      completionPercentage: Math.round(completionPercentage),
      nextObjective,
      remainingTasks,
    };
  }

  getCurrentArtifact() {
    if (this.currentArtifactIndex >= this.artifacts.length) return null;
    return this.artifacts[this.currentArtifactIndex];
  }
}

// Excavation Simulation Game Engine
export class ExcavationSimulationEngine extends GameEngine {
  private gridSize: { width: number; height: number };
  private artifacts: Array<{
    id: string;
    position: { x: number; y: number };
    depth: number;
    isDiscovered: boolean;
  }>;
  private excavatedCells: Set<string>;
  private documentsCreated: number;
  private protocolViolations: number;

  constructor(
    difficulty: DifficultyLevel,
    gridSize: { width: number; height: number },
    artifacts: Array<{
      id: string;
      position: { x: number; y: number };
      depth: number;
    }>
  ) {
    const maxScore = artifacts.length * 100 + 200; // Artifacts + protocol bonus
    super("excavation_simulation", difficulty, maxScore, {
      gridSize,
      artifacts: artifacts.map((a) => ({ ...a, isDiscovered: false })),
      excavatedCells: [],
      documentsCreated: 0,
      protocolViolations: 0,
    });

    this.gridSize = gridSize;
    this.artifacts = artifacts.map((a) => ({ ...a, isDiscovered: false }));
    this.excavatedCells = new Set();
    this.documentsCreated = 0;
    this.protocolViolations = 0;
  }

  validateAction(action: GameAction): boolean {
    switch (action.actionType) {
      case "excavate_cell":
        return this.validateExcavateAction(action);
      case "document_finding":
        return this.validateDocumentAction(action);
      case "use_tool":
        return this.validateToolAction(action);
      default:
        return false;
    }
  }

  private validateExcavateAction(action: GameAction): boolean {
    const { x, y } = action.data.position || {};
    if (typeof x !== "number" || typeof y !== "number") return false;
    if (x < 0 || x >= this.gridSize.width || y < 0 || y >= this.gridSize.height)
      return false;

    const cellKey = `${x},${y}`;
    return !this.excavatedCells.has(cellKey);
  }

  private validateDocumentAction(action: GameAction): boolean {
    return !!(action.data.artifactId && action.data.documentation);
  }

  private validateToolAction(action: GameAction): boolean {
    const validTools = ["brush", "trowel", "measuring_tape", "camera"];
    return validTools.includes(action.data.tool);
  }

  processAction(action: GameAction): ActionResult {
    switch (action.actionType) {
      case "excavate_cell":
        return this.processExcavateAction(action);
      case "document_finding":
        return this.processDocumentAction(action);
      case "use_tool":
        return this.processToolAction(action);
      default:
        return {
          success: false,
          score: 0,
          feedback: "Unknown action type",
        };
    }
  }

  private processExcavateAction(action: GameAction): ActionResult {
    const { x, y } = action.data.position;
    const cellKey = `${x},${y}`;

    this.excavatedCells.add(cellKey);

    // Check if there's an artifact at this position
    const artifact = this.artifacts.find(
      (a) => a.position.x === x && a.position.y === y && !a.isDiscovered
    );

    let score = 10; // Base excavation score
    let feedback = `Excavated cell (${x}, ${y})`;

    if (artifact) {
      artifact.isDiscovered = true;
      score += 50; // Artifact discovery bonus
      feedback += ` - Artifact discovered!`;
    }

    // Check for protocol violations (excavating too quickly without proper documentation)
    if (!action.data.properProtocol) {
      this.protocolViolations++;
      score = Math.max(0, score - 20);
      feedback += " - Protocol violation: Proper documentation required";
    }

    return {
      success: true,
      score,
      feedback,
      data: {
        artifactFound: !!artifact,
        artifactId: artifact?.id,
        protocolViolation: !action.data.properProtocol,
      },
    };
  }

  private processDocumentAction(action: GameAction): ActionResult {
    this.documentsCreated++;

    const documentation = action.data.documentation;
    let score = 30; // Base documentation score

    // Check documentation quality
    const requiredFields = ["position", "depth", "condition", "notes"];
    const providedFields = Object.keys(documentation);
    const completeness =
      requiredFields.filter(
        (field) => providedFields.includes(field) && documentation[field]
      ).length / requiredFields.length;

    score = Math.round(score * completeness);

    let feedback = `Documentation created (${Math.round(completeness * 100)}% complete)`;

    if (completeness >= 0.8) {
      feedback += " - Excellent documentation!";
    } else if (completeness >= 0.6) {
      feedback += " - Good documentation, but could be more detailed";
    } else {
      feedback += " - Documentation needs improvement";
    }

    return {
      success: completeness >= 0.5,
      score,
      feedback,
      data: {
        completeness,
        missingFields: requiredFields.filter(
          (field) => !providedFields.includes(field)
        ),
      },
    };
  }

  private processToolAction(action: GameAction): ActionResult {
    const tool = action.data.tool;
    const context = action.data.context;

    let score = 5; // Base tool usage score
    let feedback = `Used ${tool}`;

    // Check if tool is appropriate for context
    const appropriateTools: Record<string, string[]> = {
      delicate_excavation: ["brush"],
      rough_excavation: ["trowel"],
      measurement: ["measuring_tape"],
      documentation: ["camera"],
    };

    if (context && appropriateTools[context]?.includes(tool)) {
      score += 10;
      feedback += " - Appropriate tool choice!";
    } else if (context) {
      feedback += " - Consider using a different tool for this task";
    }

    return {
      success: true,
      score,
      feedback,
      data: {
        tool,
        context,
        appropriate: context ? appropriateTools[context]?.includes(tool) : true,
      },
    };
  }

  calculateLevelScore(): number {
    const discoveredArtifacts = this.artifacts.filter(
      (a) => a.isDiscovered
    ).length;
    const artifactScore = this.calculateAccuracyScore(
      discoveredArtifacts,
      this.artifacts.length,
      this.artifacts.length * 100
    );

    // Protocol bonus (fewer violations = higher bonus)
    const maxProtocolBonus = 200;
    const protocolPenalty = this.protocolViolations * 20;
    const protocolBonus = Math.max(0, maxProtocolBonus - protocolPenalty);

    return artifactScore + protocolBonus;
  }

  getCompletionStatus(): CompletionStatus {
    const discoveredArtifacts = this.artifacts.filter(
      (a) => a.isDiscovered
    ).length;
    const totalArtifacts = this.artifacts.length;
    const isComplete = discoveredArtifacts === totalArtifacts;
    const completionPercentage = (discoveredArtifacts / totalArtifacts) * 100;

    const remainingTasks: string[] = [];
    let nextObjective: string | undefined;

    if (!isComplete) {
      const remaining = totalArtifacts - discoveredArtifacts;
      nextObjective = `Discover ${remaining} more artifacts`;
      remainingTasks.push(`Find ${remaining} remaining artifacts`);

      if (this.documentsCreated < discoveredArtifacts) {
        remainingTasks.push("Document all discovered artifacts");
      }
    }

    return {
      isComplete,
      completionPercentage: Math.round(completionPercentage),
      nextObjective,
      remainingTasks,
    };
  }

  getGridState() {
    return {
      gridSize: this.gridSize,
      excavatedCells: Array.from(this.excavatedCells),
      artifacts: this.artifacts,
      protocolViolations: this.protocolViolations,
      documentsCreated: this.documentsCreated,
    };
  }
}

// Factory function to create appropriate game engine
export function createGameEngine(
  gameType: GameType,
  difficulty: DifficultyLevel,
  gameConfig: any
): GameEngine {
  switch (gameType) {
    case "artifact_identification":
      return new ArtifactIdentificationEngine(difficulty, gameConfig.artifacts);
    case "excavation_simulation":
      return new ExcavationSimulationEngine(
        difficulty,
        gameConfig.gridSize,
        gameConfig.artifacts
      );
    default:
      throw new Error(`Game engine not implemented for ${gameType}`);
  }
}
