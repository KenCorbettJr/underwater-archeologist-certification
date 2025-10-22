// Artifact identification game logic and flow management

import { Artifact, DifficultyLevel, GameAction, ActionResult } from "@/types";
import { ArtifactIdentificationEngine } from "./gameEngine";

export interface ArtifactGameConfig {
  difficulty: DifficultyLevel;
  questionCount: number;
  timeLimit?: number; // in seconds
  questionTypes: ("period" | "culture" | "category")[];
  categories?: string[];
  periods?: string[];
  cultures?: string[];
}

export interface ArtifactQuestion {
  artifact: Artifact;
  questionType: "period" | "culture" | "category";
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  timeLimit: number;
}

export interface GameSession {
  id: string;
  config: ArtifactGameConfig;
  questions: ArtifactQuestion[];
  currentQuestionIndex: number;
  answers: GameAnswer[];
  startTime: number;
  endTime?: number;
  score: number;
  maxScore: number;
  status: "active" | "completed" | "paused";
}

export interface GameAnswer {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  points: number;
  timestamp: number;
}

export class ArtifactGameManager {
  private gameEngine: ArtifactIdentificationEngine;
  private session: GameSession;

  constructor(config: ArtifactGameConfig, artifacts: Artifact[]) {
    // Generate questions based on config
    const questions = this.generateQuestions(artifacts, config);

    // Create game engine
    const engineArtifacts = questions.map((q) => ({
      id: q.artifact.id,
      name: q.artifact.name,
      period: q.artifact.historicalPeriod,
      culture: q.artifact.culture,
      correctAnswer: q.correctAnswer,
    }));

    this.gameEngine = new ArtifactIdentificationEngine(
      config.difficulty,
      engineArtifacts
    );

    // Initialize session
    this.session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      config,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: Date.now(),
      score: 0,
      maxScore: questions.reduce((sum, q) => sum + q.points, 0),
      status: "active",
    };
  }

  private generateQuestions(
    artifacts: Artifact[],
    config: ArtifactGameConfig
  ): ArtifactQuestion[] {
    const questions: ArtifactQuestion[] = [];
    const shuffledArtifacts = this.shuffleArray([...artifacts]);
    const selectedArtifacts = shuffledArtifacts.slice(0, config.questionCount);

    for (let i = 0; i < selectedArtifacts.length; i++) {
      const artifact = selectedArtifacts[i];
      const questionType =
        config.questionTypes[i % config.questionTypes.length];

      const question = this.createQuestion(
        artifact,
        questionType,
        artifacts,
        config
      );
      questions.push(question);
    }

    return questions;
  }

  private createQuestion(
    artifact: Artifact,
    questionType: "period" | "culture" | "category",
    allArtifacts: Artifact[],
    config: ArtifactGameConfig
  ): ArtifactQuestion {
    let question: string;
    let correctAnswer: string;
    let options: string[];

    switch (questionType) {
      case "period":
        question = "What historical period is this artifact from?";
        correctAnswer = artifact.historicalPeriod;
        options = this.generatePeriodOptions(artifact, allArtifacts);
        break;

      case "culture":
        question = "Which culture created this artifact?";
        correctAnswer = artifact.culture;
        options = this.generateCultureOptions(artifact, allArtifacts);
        break;

      case "category":
        question = "What category does this artifact belong to?";
        correctAnswer = artifact.category;
        options = this.generateCategoryOptions(artifact, allArtifacts);
        break;
    }

    const basePoints = this.getBasePoints(config.difficulty);
    const timeLimit = this.getTimeLimit(config.difficulty);

    return {
      artifact,
      questionType,
      question,
      options: this.shuffleArray(options),
      correctAnswer,
      points: basePoints,
      timeLimit,
    };
  }

  private generatePeriodOptions(
    artifact: Artifact,
    allArtifacts: Artifact[]
  ): string[] {
    const correctAnswer = artifact.historicalPeriod;
    const otherPeriods = [
      ...new Set(
        allArtifacts
          .map((a) => a.historicalPeriod)
          .filter((p) => p !== correctAnswer)
      ),
    ];

    const shuffledOthers = this.shuffleArray(otherPeriods);
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

  private generateCultureOptions(
    artifact: Artifact,
    allArtifacts: Artifact[]
  ): string[] {
    const correctAnswer = artifact.culture;
    const otherCultures = [
      ...new Set(
        allArtifacts.map((a) => a.culture).filter((c) => c !== correctAnswer)
      ),
    ];

    const shuffledOthers = this.shuffleArray(otherCultures);
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

  private generateCategoryOptions(
    artifact: Artifact,
    allArtifacts: Artifact[]
  ): string[] {
    const correctAnswer = artifact.category;
    const otherCategories = [
      ...new Set(
        allArtifacts.map((a) => a.category).filter((c) => c !== correctAnswer)
      ),
    ];

    const shuffledOthers = this.shuffleArray(otherCategories);
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

  private getBasePoints(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case "beginner":
        return 100;
      case "intermediate":
        return 120;
      case "advanced":
        return 150;
      default:
        return 100;
    }
  }

  private getTimeLimit(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case "beginner":
        return 45; // 45 seconds
      case "intermediate":
        return 35; // 35 seconds
      case "advanced":
        return 25; // 25 seconds
      default:
        return 45;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Public methods for game interaction

  public getCurrentQuestion(): ArtifactQuestion | null {
    if (this.session.currentQuestionIndex >= this.session.questions.length) {
      return null;
    }
    return this.session.questions[this.session.currentQuestionIndex];
  }

  public submitAnswer(answer: string, timeSpent: number): ActionResult {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      return {
        success: false,
        score: 0,
        feedback: "No active question to answer",
      };
    }

    const isCorrect =
      answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    // Calculate score with time bonus
    let points = isCorrect ? currentQuestion.points : 0;
    const timeBonus = this.calculateTimeBonus(
      timeSpent,
      currentQuestion.timeLimit
    );
    points += timeBonus;

    // Apply difficulty multiplier
    const difficultyMultiplier = this.getDifficultyMultiplier();
    points = Math.round(points * difficultyMultiplier);

    // Record answer
    const gameAnswer: GameAnswer = {
      questionIndex: this.session.currentQuestionIndex,
      selectedAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent,
      points,
      timestamp: Date.now(),
    };

    this.session.answers.push(gameAnswer);
    this.session.score += points;
    this.session.currentQuestionIndex++;

    // Check if game is complete
    if (this.session.currentQuestionIndex >= this.session.questions.length) {
      this.session.status = "completed";
      this.session.endTime = Date.now();
    }

    // Create game action for engine
    const action: GameAction = {
      id: `action_${Date.now()}`,
      timestamp: new Date(),
      actionType: "identify_artifact",
      data: {
        artifactId: currentQuestion.artifact.id,
        answer: currentQuestion.correctAnswer,
        timeSpent,
      },
    };

    // Process through game engine
    const engineResult = this.gameEngine.executeAction(action);

    return {
      success: isCorrect,
      score: points,
      feedback: this.generateFeedback(gameAnswer, currentQuestion),
      data: {
        correctAnswer: currentQuestion.correctAnswer,
        timeBonus,
        isGameComplete: this.session.status === "completed",
        nextQuestion: this.getCurrentQuestion(),
        gameProgress: {
          currentQuestion: this.session.currentQuestionIndex,
          totalQuestions: this.session.questions.length,
          score: this.session.score,
          maxScore: this.session.maxScore,
        },
      },
    };
  }

  private calculateTimeBonus(timeSpent: number, timeLimit: number): number {
    const maxBonus = 20;
    if (timeSpent <= timeLimit * 0.5) {
      return maxBonus; // Full bonus for very fast answers
    } else if (timeSpent <= timeLimit * 0.75) {
      return Math.round(maxBonus * 0.7); // Partial bonus
    } else if (timeSpent <= timeLimit) {
      return Math.round(maxBonus * 0.3); // Small bonus
    }
    return 0; // No bonus for overtime
  }

  private getDifficultyMultiplier(): number {
    switch (this.session.config.difficulty) {
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

  private generateFeedback(
    answer: GameAnswer,
    question: ArtifactQuestion
  ): string {
    if (answer.isCorrect) {
      const timeBonus = answer.points - question.points;
      let feedback = `Correct! ${question.artifact.name} is from the ${question.correctAnswer}.`;

      if (timeBonus > 0) {
        feedback += ` Time bonus: +${timeBonus} points!`;
      }

      // Add educational context
      feedback += ` ${question.artifact.significance}`;

      return feedback;
    } else {
      return `Incorrect. ${question.artifact.name} is from the ${question.correctAnswer}, not ${answer.selectedAnswer}. ${question.artifact.significance}`;
    }
  }

  public getGameSession(): GameSession {
    return { ...this.session };
  }

  public getGameStats(): {
    accuracy: number;
    averageTime: number;
    totalTime: number;
    streak: number;
    bestStreak: number;
  } {
    const answers = this.session.answers;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const accuracy =
      answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0;

    const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);
    const averageTime = answers.length > 0 ? totalTime / answers.length : 0;

    // Calculate current and best streak
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = answers.length - 1; i >= 0; i--) {
      if (answers[i].isCorrect) {
        tempStreak++;
        if (i === answers.length - 1 || currentStreak === 0) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        tempStreak = 0;
        if (i === answers.length - 1) {
          currentStreak = 0;
        }
      }
    }

    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }

    return {
      accuracy,
      averageTime,
      totalTime,
      streak: currentStreak,
      bestStreak,
    };
  }

  public pauseGame(): void {
    if (this.session.status === "active") {
      this.session.status = "paused";
    }
  }

  public resumeGame(): void {
    if (this.session.status === "paused") {
      this.session.status = "active";
    }
  }

  public isGameComplete(): boolean {
    return this.session.status === "completed";
  }

  public getProgress(): number {
    return (
      (this.session.currentQuestionIndex / this.session.questions.length) * 100
    );
  }
}

// Difficulty scaling functions
export function generateDifficultyConfig(
  difficulty: DifficultyLevel,
  availableArtifacts: Artifact[]
): ArtifactGameConfig {
  switch (difficulty) {
    case "beginner":
      return {
        difficulty,
        questionCount: Math.min(10, availableArtifacts.length),
        timeLimit: 450, // 7.5 minutes total
        questionTypes: ["period", "category"],
        categories: ["Pottery", "Tools", "Jewelry"],
        periods: ["Ancient", "Medieval", "Modern"],
      };

    case "intermediate":
      return {
        difficulty,
        questionCount: Math.min(15, availableArtifacts.length),
        timeLimit: 525, // 8.75 minutes total
        questionTypes: ["period", "culture", "category"],
        categories: [
          "Pottery",
          "Tools",
          "Weapons",
          "Jewelry",
          "Religious Items",
        ],
        periods: [
          "Ancient Egyptian",
          "Classical Greek",
          "Roman",
          "Medieval",
          "Renaissance",
        ],
      };

    case "advanced":
      return {
        difficulty,
        questionCount: Math.min(20, availableArtifacts.length),
        timeLimit: 500, // 8.33 minutes total (less time, more questions)
        questionTypes: ["period", "culture", "category"],
        // No restrictions - use all available categories, periods, cultures
      };

    default:
      return generateDifficultyConfig("beginner", availableArtifacts);
  }
}

// Scoring system functions
export function calculateFinalGameScore(session: GameSession): {
  baseScore: number;
  accuracyBonus: number;
  speedBonus: number;
  difficultyBonus: number;
  totalScore: number;
  grade: string;
  feedback: string[];
} {
  const stats = new ArtifactGameManager(session.config, []).getGameStats();

  const baseScore = session.score;
  const accuracyBonus = Math.round((stats.accuracy / 100) * 100);

  // Speed bonus based on average time vs target time
  const targetTime = 30; // 30 seconds per question
  const speedRatio = Math.max(0, (targetTime - stats.averageTime) / targetTime);
  const speedBonus = Math.round(speedRatio * 50);

  // Difficulty bonus
  const difficultyMultipliers = {
    beginner: 0,
    intermediate: 50,
    advanced: 100,
  };
  const difficultyBonus = difficultyMultipliers[session.config.difficulty];

  const totalScore = baseScore + accuracyBonus + speedBonus + difficultyBonus;

  // Calculate grade
  const percentage = (totalScore / session.maxScore) * 100;
  let grade: string;
  if (percentage >= 90) grade = "A";
  else if (percentage >= 80) grade = "B";
  else if (percentage >= 70) grade = "C";
  else if (percentage >= 60) grade = "D";
  else grade = "F";

  // Generate feedback
  const feedback: string[] = [];
  if (stats.accuracy >= 90) {
    feedback.push(
      "Excellent accuracy! You have a strong understanding of artifact identification."
    );
  } else if (stats.accuracy >= 75) {
    feedback.push(
      "Good accuracy! Keep practicing to improve your identification skills."
    );
  } else {
    feedback.push(
      "Work on improving your accuracy by studying artifact characteristics more carefully."
    );
  }

  if (stats.averageTime <= 20) {
    feedback.push("Outstanding speed! You can quickly identify artifacts.");
  } else if (stats.averageTime <= 30) {
    feedback.push(
      "Good timing! You're identifying artifacts at a steady pace."
    );
  } else {
    feedback.push(
      "Take time to study each artifact carefully, but try to be more decisive."
    );
  }

  if (stats.bestStreak >= 5) {
    feedback.push(
      `Impressive streak of ${stats.bestStreak} correct answers in a row!`
    );
  }

  return {
    baseScore,
    accuracyBonus,
    speedBonus,
    difficultyBonus,
    totalScore,
    grade,
    feedback,
  };
}
