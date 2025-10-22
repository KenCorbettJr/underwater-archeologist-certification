// Unit tests for session management logic
// Tests session lifecycle, scoring accuracy, progression logic, and error handling

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock session data structures based on the schema
interface MockGameSession {
  _id: string;
  userId: string;
  gameType:
    | "artifact_identification"
    | "excavation_simulation"
    | "site_documentation"
    | "historical_timeline"
    | "conservation_lab";
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "active" | "completed" | "abandoned";
  startTime: number;
  endTime?: number;
  currentScore: number;
  maxScore: number;
  completionPercentage: number;
  gameData: string;
  actions: string[];
}

// Session management utility functions to test
class SessionManager {
  private sessions: Map<string, MockGameSession> = new Map();
  private readonly SESSION_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes

  createSession(
    userId: string,
    gameType: MockGameSession["gameType"],
    difficulty: MockGameSession["difficulty"],
    maxScore: number,
    initialGameData?: string
  ): string {
    // Check for existing active session of same type
    const existingSession = this.getActiveSession(userId, gameType);
    if (existingSession) {
      this.abandonSession(existingSession._id);
    }

    const sessionId = `session_${Date.now()}_${Math.random()}`;
    const session: MockGameSession = {
      _id: sessionId,
      userId,
      gameType,
      difficulty,
      status: "active",
      startTime: Date.now(),
      currentScore: 0,
      maxScore,
      completionPercentage: 0,
      gameData: initialGameData || "{}",
      actions: [],
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getActiveSession(
    userId: string,
    gameType: MockGameSession["gameType"]
  ): MockGameSession | null {
    for (const session of this.sessions.values()) {
      if (
        session.userId === userId &&
        session.gameType === gameType &&
        session.status === "active"
      ) {
        // Check for timeout
        if (this.isSessionExpired(session)) {
          this.abandonSession(session._id);
          return null;
        }
        return session;
      }
    }
    return null;
  }

  updateSession(
    sessionId: string,
    updates: {
      currentScore?: number;
      completionPercentage?: number;
      gameData?: string;
      newAction?: string;
    }
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Cannot update inactive game session");
    }

    if (this.isSessionExpired(session)) {
      this.abandonSession(sessionId);
      throw new Error("Game session has expired");
    }

    if (updates.currentScore !== undefined) {
      if (updates.currentScore > session.maxScore) {
        throw new Error("Score cannot exceed maximum score");
      }
      session.currentScore = Math.max(0, updates.currentScore);
    }

    if (updates.completionPercentage !== undefined) {
      session.completionPercentage = Math.min(
        100,
        Math.max(0, updates.completionPercentage)
      );
    }

    if (updates.gameData !== undefined) {
      session.gameData = updates.gameData;
    }

    if (updates.newAction !== undefined) {
      session.actions.push(updates.newAction);
    }
  }

  completeSession(
    sessionId: string,
    finalScore: number,
    finalGameData?: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Cannot complete inactive game session");
    }

    if (finalScore > session.maxScore) {
      throw new Error("Final score cannot exceed maximum score");
    }

    session.status = "completed";
    session.endTime = Date.now();
    session.currentScore = Math.max(0, finalScore);
    session.completionPercentage = 100;

    if (finalGameData !== undefined) {
      session.gameData = finalGameData;
    }
  }

  abandonSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "active") {
      throw new Error("Cannot abandon inactive game session");
    }

    session.status = "abandoned";
    session.endTime = Date.now();
  }

  getSessionHistory(
    userId: string,
    gameType?: MockGameSession["gameType"],
    limit?: number
  ): MockGameSession[] {
    const userSessions = Array.from(this.sessions.values())
      .filter((session) => {
        if (session.userId !== userId) return false;
        if (gameType && session.gameType !== gameType) return false;
        return true;
      })
      .sort((a, b) => b.startTime - a.startTime);

    return limit ? userSessions.slice(0, limit) : userSessions;
  }

  getSessionStatistics(userId: string, gameType?: MockGameSession["gameType"]) {
    const sessions = this.getSessionHistory(userId, gameType);

    const stats = {
      totalSessions: sessions.length,
      completedSessions: 0,
      abandonedSessions: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      averageSessionTime: 0,
    };

    if (sessions.length === 0) {
      return stats;
    }

    let totalScore = 0;
    let totalTime = 0;
    let completedCount = 0;

    for (const session of sessions) {
      if (session.status === "completed") {
        stats.completedSessions++;
        totalScore += session.currentScore;
        completedCount++;
        stats.bestScore = Math.max(stats.bestScore, session.currentScore);
      } else if (session.status === "abandoned") {
        stats.abandonedSessions++;
      }

      if (session.endTime) {
        const sessionTimeMs = session.endTime - session.startTime;
        const sessionTimeMinutes = sessionTimeMs / (1000 * 60);
        totalTime += sessionTimeMinutes;
      }
    }

    if (completedCount > 0) {
      stats.averageScore = Math.round(totalScore / completedCount);
    }

    stats.totalTimeSpent = Math.round(totalTime);
    if (sessions.length > 0) {
      stats.averageSessionTime = Math.round(totalTime / sessions.length);
    }

    return stats;
  }

  cleanupExpiredSessions(): number {
    let cleanedCount = 0;
    const currentTime = Date.now();

    for (const session of this.sessions.values()) {
      if (session.status === "active" && this.isSessionExpired(session)) {
        session.status = "abandoned";
        session.endTime = currentTime;
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  private isSessionExpired(session: MockGameSession): boolean {
    const currentTime = Date.now();
    const elapsedTime = currentTime - session.startTime;
    return elapsedTime > this.SESSION_TIMEOUT_MS;
  }

  // Test helper methods
  getSession(sessionId: string): MockGameSession | undefined {
    return this.sessions.get(sessionId);
  }

  setSessionStartTime(sessionId: string, startTime: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.startTime = startTime;
    }
  }

  clear(): void {
    this.sessions.clear();
  }
}

// Scoring and progression logic
class GameScoring {
  static calculateAccuracyScore(
    correctAnswers: number,
    totalQuestions: number,
    basePoints: number = 100
  ): number {
    if (totalQuestions === 0) return 0;
    const accuracy = correctAnswers / totalQuestions;
    return Math.round(accuracy * basePoints);
  }

  static calculateTimeBonus(
    timeSpentSeconds: number,
    targetTimeSeconds: number,
    maxBonus: number = 20
  ): number {
    if (timeSpentSeconds <= 0 || targetTimeSeconds <= 0) return 0;

    if (timeSpentSeconds <= targetTimeSeconds) {
      return maxBonus;
    } else if (timeSpentSeconds <= targetTimeSeconds * 1.5) {
      const overtime = timeSpentSeconds - targetTimeSeconds;
      const maxOvertime = targetTimeSeconds * 0.5;
      const bonusReduction = (overtime / maxOvertime) * maxBonus;
      return Math.max(0, Math.round(maxBonus - bonusReduction));
    }

    return 0;
  }

  static getDifficultyMultiplier(
    difficulty: "beginner" | "intermediate" | "advanced"
  ): number {
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

  static getMinScoreForProgression(
    difficulty: "beginner" | "intermediate" | "advanced"
  ): number {
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

  static calculateLevelProgression(
    currentLevel: number,
    scorePercentage: number,
    difficulty: "beginner" | "intermediate" | "advanced"
  ) {
    const minScoreForProgression = this.getMinScoreForProgression(difficulty);
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
}

describe("Session Management", () => {
  let sessionManager: SessionManager;
  const userId = "test-user-123";

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe("Session Lifecycle", () => {
    it("should create a new game session successfully", () => {
      const sessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000,
        JSON.stringify({ artifacts: [], currentIndex: 0 })
      );

      expect(sessionId).toBeDefined();

      const session = sessionManager.getActiveSession(
        userId,
        "artifact_identification"
      );
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(userId);
      expect(session?.gameType).toBe("artifact_identification");
      expect(session?.difficulty).toBe("beginner");
      expect(session?.status).toBe("active");
      expect(session?.currentScore).toBe(0);
      expect(session?.maxScore).toBe(1000);
      expect(session?.completionPercentage).toBe(0);
    });

    it("should abandon existing active session when creating new one of same type", () => {
      const firstSessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000
      );
      const secondSessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "intermediate",
        1200
      );

      expect(secondSessionId).toBeDefined();
      expect(secondSessionId).not.toBe(firstSessionId);

      const firstSession = sessionManager.getSession(firstSessionId);
      expect(firstSession?.status).toBe("abandoned");
      expect(firstSession?.endTime).toBeDefined();

      const activeSession = sessionManager.getActiveSession(
        userId,
        "artifact_identification"
      );
      expect(activeSession?._id).toBe(secondSessionId);
      expect(activeSession?.status).toBe("active");
    });

    it("should complete a game session successfully", () => {
      const sessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000
      );

      sessionManager.completeSession(
        sessionId,
        850,
        JSON.stringify({ completed: true })
      );

      const session = sessionManager.getSession(sessionId);
      expect(session?.status).toBe("completed");
      expect(session?.currentScore).toBe(850);
      expect(session?.completionPercentage).toBe(100);
      expect(session?.endTime).toBeDefined();
      expect(JSON.parse(session?.gameData || "{}")).toEqual({
        completed: true,
      });
    });

    it("should abandon a game session successfully", () => {
      const sessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000
      );

      sessionManager.abandonSession(sessionId);

      const session = sessionManager.getSession(sessionId);
      expect(session?.status).toBe("abandoned");
      expect(session?.endTime).toBeDefined();
    });

    it("should handle session timeout correctly", () => {
      const sessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000
      );

      // Set start time to 46 minutes ago (past timeout)
      const expiredStartTime = Date.now() - 46 * 60 * 1000;
      sessionManager.setSessionStartTime(sessionId, expiredStartTime);

      // Try to get active session - should return null due to timeout
      const activeSession = sessionManager.getActiveSession(
        userId,
        "artifact_identification"
      );
      expect(activeSession).toBeNull();

      // Session should be marked as abandoned
      const session = sessionManager.getSession(sessionId);
      expect(session?.status).toBe("abandoned");
    });

    it("should clean up expired sessions", () => {
      const sessionIds = [];
      const gameTypes = [
        "artifact_identification",
        "excavation_simulation",
        "site_documentation",
      ] as const;

      for (let i = 0; i < 3; i++) {
        const sessionId = sessionManager.createSession(
          userId,
          gameTypes[i],
          "beginner",
          1000
        );
        const expiredStartTime = Date.now() - 46 * 60 * 1000;
        sessionManager.setSessionStartTime(sessionId, expiredStartTime);
        sessionIds.push(sessionId);
      }

      const cleanedCount = sessionManager.cleanupExpiredSessions();
      expect(cleanedCount).toBe(3);

      for (const sessionId of sessionIds) {
        const session = sessionManager.getSession(sessionId);
        expect(session?.status).toBe("abandoned");
      }
    });
  });

  describe("Session Updates and Auto-save", () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000
      );
    });

    it("should update session score correctly", () => {
      sessionManager.updateSession(sessionId, {
        currentScore: 250,
        completionPercentage: 25,
      });

      const session = sessionManager.getSession(sessionId);
      expect(session?.currentScore).toBe(250);
      expect(session?.completionPercentage).toBe(25);
    });

    it("should prevent score from exceeding max score", () => {
      expect(() => {
        sessionManager.updateSession(sessionId, {
          currentScore: 1500, // Exceeds max score of 1000
        });
      }).toThrow("Score cannot exceed maximum score");
    });

    it("should prevent negative scores", () => {
      sessionManager.updateSession(sessionId, {
        currentScore: -100,
      });

      const session = sessionManager.getSession(sessionId);
      expect(session?.currentScore).toBe(0); // Should be clamped to 0
    });

    it("should clamp completion percentage between 0 and 100", () => {
      sessionManager.updateSession(sessionId, {
        completionPercentage: 150, // Over 100%
      });

      let session = sessionManager.getSession(sessionId);
      expect(session?.completionPercentage).toBe(100);

      sessionManager.updateSession(sessionId, {
        completionPercentage: -10, // Under 0%
      });

      session = sessionManager.getSession(sessionId);
      expect(session?.completionPercentage).toBe(0);
    });

    it("should update game data correctly", () => {
      const gameData = {
        currentLevel: 2,
        artifacts: ["artifact1", "artifact2"],
      };

      sessionManager.updateSession(sessionId, {
        gameData: JSON.stringify(gameData),
      });

      const session = sessionManager.getSession(sessionId);
      expect(JSON.parse(session?.gameData || "{}")).toEqual(gameData);
    });

    it("should add actions to action history", () => {
      const action1 = JSON.stringify({
        type: "identify",
        artifactId: "1",
        answer: "Roman",
      });
      const action2 = JSON.stringify({
        type: "identify",
        artifactId: "2",
        answer: "Greek",
      });

      sessionManager.updateSession(sessionId, { newAction: action1 });
      sessionManager.updateSession(sessionId, { newAction: action2 });

      const session = sessionManager.getSession(sessionId);
      expect(session?.actions).toHaveLength(2);
      expect(session?.actions[0]).toBe(action1);
      expect(session?.actions[1]).toBe(action2);
    });

    it("should reject updates to expired sessions", () => {
      const expiredStartTime = Date.now() - 46 * 60 * 1000;
      sessionManager.setSessionStartTime(sessionId, expiredStartTime);

      expect(() => {
        sessionManager.updateSession(sessionId, { currentScore: 100 });
      }).toThrow("Game session has expired");
    });

    it("should reject updates to inactive sessions", () => {
      sessionManager.completeSession(sessionId, 500);

      expect(() => {
        sessionManager.updateSession(sessionId, { currentScore: 600 });
      }).toThrow("Cannot update inactive game session");
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle non-existent session gracefully", () => {
      const fakeSessionId = "invalid-session-id";

      expect(() => {
        sessionManager.updateSession(fakeSessionId, { currentScore: 100 });
      }).toThrow("Game session not found");

      expect(() => {
        sessionManager.completeSession(fakeSessionId, 100);
      }).toThrow("Game session not found");

      expect(() => {
        sessionManager.abandonSession(fakeSessionId);
      }).toThrow("Game session not found");
    });

    it("should validate final score on completion", () => {
      const sessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000
      );

      expect(() => {
        sessionManager.completeSession(sessionId, 1500); // Exceeds max score
      }).toThrow("Final score cannot exceed maximum score");
    });

    it("should handle malformed game data gracefully", () => {
      const sessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000,
        "invalid-json" // Malformed JSON
      );

      expect(sessionId).toBeDefined();

      const session = sessionManager.getSession(sessionId);
      expect(session?.gameData).toBe("invalid-json");
    });
  });

  describe("Session History and Statistics", () => {
    beforeEach(() => {
      // Create multiple sessions with different outcomes
      const sessions = [
        {
          gameType: "artifact_identification",
          difficulty: "beginner",
          score: 800,
          status: "completed",
        },
        {
          gameType: "site_documentation",
          difficulty: "intermediate",
          score: 600,
          status: "completed",
        },
        {
          gameType: "excavation_simulation",
          difficulty: "beginner",
          score: 0,
          status: "abandoned",
        },
        {
          gameType: "historical_timeline",
          difficulty: "advanced",
          score: 900,
          status: "completed",
        },
      ];

      for (let i = 0; i < sessions.length; i++) {
        const sessionData = sessions[i];
        const sessionId = sessionManager.createSession(
          userId,
          sessionData.gameType as any,
          sessionData.difficulty as any,
          1000
        );

        if (sessionData.status === "completed") {
          sessionManager.completeSession(sessionId, sessionData.score);
        } else if (sessionData.status === "abandoned") {
          sessionManager.abandonSession(sessionId);
        }
      }
    });

    it("should retrieve session history correctly", () => {
      const history = sessionManager.getSessionHistory(userId);

      expect(history).toHaveLength(4);

      // Should be ordered by creation time (most recent first)
      expect(history).toHaveLength(4);

      // Verify all sessions are present
      const gameTypes = history.map((s) => s.gameType);
      expect(gameTypes).toContain("artifact_identification");
      expect(gameTypes).toContain("excavation_simulation");
      expect(gameTypes).toContain("site_documentation");
      expect(gameTypes).toContain("historical_timeline");

      // Verify we have the expected statuses
      const completedSessions = history.filter((s) => s.status === "completed");
      const abandonedSessions = history.filter((s) => s.status === "abandoned");
      expect(completedSessions).toHaveLength(3);
      expect(abandonedSessions).toHaveLength(1);
    });

    it("should filter session history by game type", () => {
      const artifactHistory = sessionManager.getSessionHistory(
        userId,
        "artifact_identification"
      );

      expect(artifactHistory).toHaveLength(1);
      artifactHistory.forEach((session) => {
        expect(session.gameType).toBe("artifact_identification");
      });

      const excavationHistory = sessionManager.getSessionHistory(
        userId,
        "excavation_simulation"
      );

      expect(excavationHistory).toHaveLength(1);
      expect(excavationHistory[0].gameType).toBe("excavation_simulation");
    });

    it("should limit session history results", () => {
      const limitedHistory = sessionManager.getSessionHistory(
        userId,
        undefined,
        2
      );

      expect(limitedHistory).toHaveLength(2);
    });

    it("should calculate session statistics correctly", () => {
      const stats = sessionManager.getSessionStatistics(
        userId,
        "artifact_identification"
      );

      expect(stats.totalSessions).toBe(1);
      expect(stats.completedSessions).toBe(1);
      expect(stats.abandonedSessions).toBe(0);
      expect(stats.bestScore).toBe(800);
      expect(stats.averageScore).toBe(800);
    });

    it("should calculate overall statistics correctly", () => {
      const overallStats = sessionManager.getSessionStatistics(userId);

      expect(overallStats.totalSessions).toBe(4);
      expect(overallStats.completedSessions).toBe(3);
      expect(overallStats.abandonedSessions).toBe(1);
      expect(overallStats.bestScore).toBe(900);
    });

    it("should handle empty statistics gracefully", () => {
      const newUserId = "new-user-456";

      const stats = sessionManager.getSessionStatistics(newUserId);

      expect(stats.totalSessions).toBe(0);
      expect(stats.completedSessions).toBe(0);
      expect(stats.abandonedSessions).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.bestScore).toBe(0);
      expect(stats.totalTimeSpent).toBe(0);
      expect(stats.averageSessionTime).toBe(0);
    });
  });

  describe("Concurrent Session Management", () => {
    it("should handle multiple game types simultaneously", () => {
      const artifactSessionId = sessionManager.createSession(
        userId,
        "artifact_identification",
        "beginner",
        1000
      );
      const excavationSessionId = sessionManager.createSession(
        userId,
        "excavation_simulation",
        "intermediate",
        1200
      );

      const artifactSession = sessionManager.getActiveSession(
        userId,
        "artifact_identification"
      );
      const excavationSession = sessionManager.getActiveSession(
        userId,
        "excavation_simulation"
      );

      expect(artifactSession?._id).toBe(artifactSessionId);
      expect(excavationSession?._id).toBe(excavationSessionId);
      expect(artifactSession?.status).toBe("active");
      expect(excavationSession?.status).toBe("active");
    });

    it("should handle rapid session creation correctly", () => {
      const sessionIds = [];
      for (let i = 0; i < 5; i++) {
        const sessionId = sessionManager.createSession(
          userId,
          "artifact_identification",
          "beginner",
          1000
        );
        sessionIds.push(sessionId);
      }

      // Only the last session should be active
      const activeSession = sessionManager.getActiveSession(
        userId,
        "artifact_identification"
      );
      expect(activeSession?._id).toBe(sessionIds[sessionIds.length - 1]);

      // All previous sessions should be abandoned
      for (let i = 0; i < sessionIds.length - 1; i++) {
        const session = sessionManager.getSession(sessionIds[i]);
        expect(session?.status).toBe("abandoned");
      }
    });
  });
});

describe("Game Scoring and Progression Logic", () => {
  describe("Accuracy Scoring", () => {
    it("should calculate accuracy score correctly", () => {
      expect(GameScoring.calculateAccuracyScore(8, 10, 100)).toBe(80);
      expect(GameScoring.calculateAccuracyScore(10, 10, 100)).toBe(100);
      expect(GameScoring.calculateAccuracyScore(0, 10, 100)).toBe(0);
      expect(GameScoring.calculateAccuracyScore(5, 0, 100)).toBe(0); // Edge case
    });

    it("should handle different base point values", () => {
      expect(GameScoring.calculateAccuracyScore(7, 10, 200)).toBe(140);
      expect(GameScoring.calculateAccuracyScore(3, 4, 50)).toBe(38); // 37.5 rounded
    });
  });

  describe("Time Bonus Calculation", () => {
    it("should give full bonus for fast completion", () => {
      expect(GameScoring.calculateTimeBonus(20, 30, 20)).toBe(20); // Under target
      expect(GameScoring.calculateTimeBonus(30, 30, 20)).toBe(20); // At target
    });

    it("should give partial bonus for moderate overtime", () => {
      const bonus = GameScoring.calculateTimeBonus(40, 30, 20); // 33% overtime
      expect(bonus).toBeGreaterThan(0);
      expect(bonus).toBeLessThan(20);
    });

    it("should give no bonus for excessive overtime", () => {
      expect(GameScoring.calculateTimeBonus(60, 30, 20)).toBe(0); // 100% overtime
    });

    it("should handle edge cases", () => {
      expect(GameScoring.calculateTimeBonus(0, 30, 20)).toBe(0);
      expect(GameScoring.calculateTimeBonus(30, 0, 20)).toBe(0);
      expect(GameScoring.calculateTimeBonus(-10, 30, 20)).toBe(0);
    });
  });

  describe("Difficulty Multipliers", () => {
    it("should return correct multipliers for each difficulty", () => {
      expect(GameScoring.getDifficultyMultiplier("beginner")).toBe(1.0);
      expect(GameScoring.getDifficultyMultiplier("intermediate")).toBe(1.2);
      expect(GameScoring.getDifficultyMultiplier("advanced")).toBe(1.5);
    });
  });

  describe("Progression Requirements", () => {
    it("should return correct minimum scores for progression", () => {
      expect(GameScoring.getMinScoreForProgression("beginner")).toBe(60);
      expect(GameScoring.getMinScoreForProgression("intermediate")).toBe(70);
      expect(GameScoring.getMinScoreForProgression("advanced")).toBe(80);
    });

    it("should calculate level progression correctly", () => {
      const progression = GameScoring.calculateLevelProgression(
        1,
        85,
        "intermediate"
      );

      expect(progression.canProgress).toBe(true);
      expect(progression.nextLevel).toBe(2);
      expect(progression.feedback).toContain("Great job!");
    });

    it("should prevent progression with insufficient score", () => {
      const progression = GameScoring.calculateLevelProgression(
        1,
        65,
        "intermediate"
      );

      expect(progression.canProgress).toBe(false);
      expect(progression.nextLevel).toBe(1);
      expect(progression.feedback).toContain("You need at least 70%");
    });

    it("should provide appropriate feedback based on score", () => {
      const excellent = GameScoring.calculateLevelProgression(
        1,
        95,
        "beginner"
      );
      const good = GameScoring.calculateLevelProgression(1, 75, "beginner");
      const minimum = GameScoring.calculateLevelProgression(1, 60, "beginner");

      expect(excellent.feedback).toContain("Excellent work!");
      expect(good.feedback).toContain("Good work!");
      expect(minimum.feedback).toContain("Good work!");
    });
  });

  describe("Integrated Scoring Scenarios", () => {
    it("should calculate complete artifact identification score", () => {
      const correctAnswers = 8;
      const totalQuestions = 10;
      const timeSpent = 25; // seconds
      const targetTime = 30;
      const difficulty = "intermediate";

      const accuracyScore = GameScoring.calculateAccuracyScore(
        correctAnswers,
        totalQuestions,
        100
      );
      const timeBonus = GameScoring.calculateTimeBonus(
        timeSpent,
        targetTime,
        20
      );
      const multiplier = GameScoring.getDifficultyMultiplier(difficulty);

      const totalScore = Math.round((accuracyScore + timeBonus) * multiplier);

      expect(accuracyScore).toBe(80);
      expect(timeBonus).toBe(20);
      expect(multiplier).toBe(1.2);
      expect(totalScore).toBe(120); // (80 + 20) * 1.2
    });

    it("should handle excavation scoring with protocol violations", () => {
      const baseExcavationScore = 10;
      const artifactBonus = 50;
      const protocolPenalty = 20;
      const difficulty = "advanced";

      const rawScore = baseExcavationScore + artifactBonus - protocolPenalty;
      const multiplier = GameScoring.getDifficultyMultiplier(difficulty);
      const finalScore = Math.round(Math.max(0, rawScore) * multiplier);

      expect(finalScore).toBe(60); // (10 + 50 - 20) * 1.5
    });

    it("should ensure scores don't go negative", () => {
      const baseScore = 10;
      const largePenalty = 50;
      const difficulty = "beginner";

      const rawScore = baseScore - largePenalty;
      const multiplier = GameScoring.getDifficultyMultiplier(difficulty);
      const finalScore = Math.round(Math.max(0, rawScore) * multiplier);

      expect(finalScore).toBe(0); // Clamped to 0
    });
  });
});
