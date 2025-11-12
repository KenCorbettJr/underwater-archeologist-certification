// Unit tests for progress synchronization
// Tests cross-device sync, backup/restore, and data validation

import { describe, it, expect } from "vitest";
import {
  getDeviceInfo,
  formatProgressForBackup,
  parseBackupData,
  calculateProgressDiff,
  formatBackupDate,
  getBackupTypeLabel,
  validateProgressData,
  createProgressSnapshot,
  getTimeSinceSync,
} from "../progressSync";

describe("Progress Synchronization", () => {
  describe("Device Information", () => {
    it("should generate device info with required fields", () => {
      const deviceInfo = getDeviceInfo();
      const parsed = JSON.parse(deviceInfo);

      expect(parsed).toHaveProperty("userAgent");
      expect(parsed).toHaveProperty("platform");
      expect(parsed).toHaveProperty("language");
      expect(parsed).toHaveProperty("timestamp");
      expect(typeof parsed.timestamp).toBe("number");
    });

    it("should generate unique timestamps for different calls", () => {
      const info1 = JSON.parse(getDeviceInfo());
      const info2 = JSON.parse(getDeviceInfo());

      expect(info2.timestamp).toBeGreaterThanOrEqual(info1.timestamp);
    });
  });

  describe("Backup Data Formatting", () => {
    it("should format progress data correctly", () => {
      const overallProgress = {
        overallCompletion: 45,
        certificationStatus: "not_eligible" as const,
        lastActivity: Date.now(),
        totalGameTime: 120,
        totalScore: 850,
      };

      const gameProgress = [
        {
          gameType: "artifact_identification" as const,
          completedLevels: 3,
          totalLevels: 5,
          bestScore: 85,
          averageScore: 80,
          timeSpent: 60,
          lastPlayed: Date.now(),
          achievements: ["first_artifact"],
        },
      ];

      const backupString = formatProgressForBackup(
        overallProgress,
        gameProgress
      );
      const parsed = JSON.parse(backupString);

      expect(parsed).toHaveProperty("overallProgress");
      expect(parsed).toHaveProperty("gameProgress");
      expect(parsed).toHaveProperty("syncTime");
      expect(parsed.overallProgress.overallCompletion).toBe(45);
      expect(parsed.gameProgress).toHaveLength(1);
      expect(parsed.gameProgress[0].gameType).toBe("artifact_identification");
    });

    it("should handle null overall progress", () => {
      const backupString = formatProgressForBackup(null, []);
      const parsed = JSON.parse(backupString);

      expect(parsed.overallProgress).toBeNull();
      expect(parsed.gameProgress).toEqual([]);
    });

    it("should include sync timestamp", () => {
      const beforeTime = Date.now();
      const backupString = formatProgressForBackup(null, []);
      const afterTime = Date.now();
      const parsed = JSON.parse(backupString);

      expect(parsed.syncTime).toBeGreaterThanOrEqual(beforeTime);
      expect(parsed.syncTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("Backup Data Parsing", () => {
    it("should parse valid backup data", () => {
      const backupData = {
        overallProgress: {
          overallCompletion: 50,
          certificationStatus: "not_eligible" as const,
          lastActivity: Date.now(),
          totalGameTime: 100,
          totalScore: 750,
        },
        gameProgress: [
          {
            gameType: "excavation_simulation" as const,
            completedLevels: 2,
            totalLevels: 4,
            bestScore: 75,
            averageScore: 70,
            timeSpent: 45,
            lastPlayed: Date.now(),
            achievements: [],
          },
        ],
        syncTime: Date.now(),
      };

      const backupString = JSON.stringify(backupData);
      const parsed = parseBackupData(backupString);

      expect(parsed.overallProgress?.overallCompletion).toBe(50);
      expect(parsed.gameProgress).toHaveLength(1);
      expect(parsed.syncTime).toBe(backupData.syncTime);
    });

    it("should throw error for invalid JSON", () => {
      expect(() => {
        parseBackupData("invalid json {");
      }).toThrow();
    });

    it("should parse null as valid JSON", () => {
      // "null" is valid JSON, though it may not be useful backup data
      const result = parseBackupData("null");
      expect(result).toBeNull();
    });
  });

  describe("Progress Difference Calculation", () => {
    it("should calculate completion change correctly", () => {
      const oldProgress = {
        overallProgress: {
          overallCompletion: 30,
          certificationStatus: "not_eligible" as const,
          lastActivity: Date.now(),
          totalGameTime: 60,
          totalScore: 500,
        },
        gameProgress: [],
        syncTime: Date.now() - 3600000,
      };

      const newProgress = {
        overallProgress: {
          overallCompletion: 50,
          certificationStatus: "not_eligible" as const,
          lastActivity: Date.now(),
          totalGameTime: 100,
          totalScore: 800,
        },
        gameProgress: [],
        syncTime: Date.now(),
      };

      const diff = calculateProgressDiff(oldProgress, newProgress);

      expect(diff.overallCompletionChange).toBe(20);
      expect(diff.scoreChange).toBe(300);
      expect(diff.timeChange).toBe(40);
    });

    it("should detect new achievements", () => {
      const oldProgress = {
        overallProgress: null,
        gameProgress: [
          {
            gameType: "artifact_identification" as const,
            completedLevels: 1,
            totalLevels: 5,
            bestScore: 80,
            averageScore: 80,
            timeSpent: 20,
            lastPlayed: Date.now(),
            achievements: ["first_artifact"],
          },
        ],
        syncTime: Date.now() - 3600000,
      };

      const newProgress = {
        overallProgress: null,
        gameProgress: [
          {
            gameType: "artifact_identification" as const,
            completedLevels: 2,
            totalLevels: 5,
            bestScore: 92,
            averageScore: 86,
            timeSpent: 40,
            lastPlayed: Date.now(),
            achievements: ["first_artifact", "artifact_expert"],
          },
        ],
        syncTime: Date.now(),
      };

      const diff = calculateProgressDiff(oldProgress, newProgress);

      expect(diff.newAchievements).toContain("artifact_expert");
      expect(diff.newAchievements).toHaveLength(1);
    });

    it("should handle null progress values", () => {
      const oldProgress = {
        overallProgress: null,
        gameProgress: [],
        syncTime: Date.now() - 3600000,
      };

      const newProgress = {
        overallProgress: {
          overallCompletion: 25,
          certificationStatus: "not_eligible" as const,
          lastActivity: Date.now(),
          totalGameTime: 50,
          totalScore: 400,
        },
        gameProgress: [],
        syncTime: Date.now(),
      };

      const diff = calculateProgressDiff(oldProgress, newProgress);

      expect(diff.overallCompletionChange).toBe(25);
      expect(diff.scoreChange).toBe(400);
      expect(diff.timeChange).toBe(50);
    });
  });

  describe("Data Validation", () => {
    it("should validate correct progress data structure", () => {
      const validData = {
        syncTime: Date.now(),
        gameProgress: [
          {
            gameType: "artifact_identification",
            completedLevels: 3,
            totalLevels: 5,
            bestScore: 85,
            averageScore: 80,
            timeSpent: 60,
            lastPlayed: Date.now(),
            achievements: [],
          },
        ],
        overallProgress: {
          overallCompletion: 40,
          certificationStatus: "not_eligible",
          lastActivity: Date.now(),
          totalGameTime: 100,
          totalScore: 700,
        },
      };

      expect(validateProgressData(validData)).toBe(true);
    });

    it("should reject data without syncTime", () => {
      const invalidData = {
        gameProgress: [],
        overallProgress: null,
      };

      expect(validateProgressData(invalidData)).toBe(false);
    });

    it("should reject data without gameProgress array", () => {
      const invalidData = {
        syncTime: Date.now(),
        overallProgress: null,
      };

      expect(validateProgressData(invalidData)).toBe(false);
    });

    it("should reject data with invalid gameProgress entries", () => {
      const invalidData = {
        syncTime: Date.now(),
        gameProgress: [
          {
            // Missing gameType and completedLevels
            totalLevels: 5,
          },
        ],
      };

      expect(validateProgressData(invalidData)).toBe(false);
    });

    it("should reject null or non-object data", () => {
      expect(validateProgressData(null)).toBe(false);
      expect(validateProgressData(undefined)).toBe(false);
      expect(validateProgressData("string")).toBe(false);
      expect(validateProgressData(123)).toBe(false);
    });
  });

  describe("Progress Snapshot Creation", () => {
    it("should create snapshot with all required fields", () => {
      const gameProgress = {
        completedLevels: 3,
        totalLevels: 5,
        bestScore: 85,
        averageScore: 80,
        timeSpent: 60,
        lastPlayed: Date.now(),
        achievements: ["first_artifact"],
      };

      const overallProgress = {
        overallCompletion: 45,
        certificationStatus: "not_eligible" as const,
        lastActivity: Date.now(),
        totalGameTime: 120,
        totalScore: 850,
      };

      const snapshot = createProgressSnapshot(
        "artifact_identification",
        gameProgress,
        overallProgress
      );

      expect(snapshot.completedLevels).toBe(3);
      expect(snapshot.totalLevels).toBe(5);
      expect(snapshot.score).toBe(85);
      expect(snapshot.timeSpent).toBe(60);
      expect(snapshot.overallCompletion).toBe(45);
      expect(snapshot.snapshotData).toBeDefined();

      const parsedSnapshot = JSON.parse(snapshot.snapshotData);
      expect(parsedSnapshot).toHaveProperty("gameProgress");
      expect(parsedSnapshot).toHaveProperty("overallProgress");
      expect(parsedSnapshot).toHaveProperty("timestamp");
    });

    it("should handle missing progress values", () => {
      const snapshot = createProgressSnapshot(
        "excavation_simulation",
        {},
        null
      );

      expect(snapshot.completedLevels).toBe(0);
      expect(snapshot.totalLevels).toBe(0);
      expect(snapshot.score).toBe(0);
      expect(snapshot.timeSpent).toBe(0);
      expect(snapshot.overallCompletion).toBe(0);
    });
  });

  describe("Utility Functions", () => {
    it("should format backup date correctly", () => {
      const timestamp = new Date("2024-01-15T14:30:00").getTime();
      const formatted = formatBackupDate(timestamp);

      expect(formatted).toContain("Jan");
      expect(formatted).toContain("15");
      expect(formatted).toContain("2024");
    });

    it("should return correct backup type labels", () => {
      expect(getBackupTypeLabel("automatic")).toBe("Automatic Backup");
      expect(getBackupTypeLabel("manual")).toBe("Manual Backup");
      expect(getBackupTypeLabel("pre_sync")).toBe("Pre-Sync Backup");
    });

    it("should calculate time since sync correctly", () => {
      const now = Date.now();

      expect(getTimeSinceSync(null)).toBe("Never synced");
      expect(getTimeSinceSync(now)).toBe("Just now");
      expect(getTimeSinceSync(now - 30000)).toBe("Just now");
      expect(getTimeSinceSync(now - 120000)).toBe("2 minutes ago");
      expect(getTimeSinceSync(now - 3600000)).toBe("1 hour ago");
      expect(getTimeSinceSync(now - 7200000)).toBe("2 hours ago");
      expect(getTimeSinceSync(now - 86400000)).toBe("1 day ago");
      expect(getTimeSinceSync(now - 172800000)).toBe("2 days ago");
    });
  });

  describe("Cross-Device Synchronization Reliability", () => {
    it("should maintain data integrity across backup and restore", () => {
      const originalProgress = {
        overallCompletion: 65,
        certificationStatus: "not_eligible" as const,
        lastActivity: Date.now(),
        totalGameTime: 180,
        totalScore: 1200,
      };

      const originalGameProgress = [
        {
          gameType: "artifact_identification" as const,
          completedLevels: 4,
          totalLevels: 5,
          bestScore: 88,
          averageScore: 85,
          timeSpent: 80,
          lastPlayed: Date.now(),
          achievements: ["first_artifact", "artifact_expert"],
        },
        {
          gameType: "excavation_simulation" as const,
          completedLevels: 3,
          totalLevels: 4,
          bestScore: 78,
          averageScore: 75,
          timeSpent: 70,
          lastPlayed: Date.now(),
          achievements: [],
        },
      ];

      // Format for backup
      const backupString = formatProgressForBackup(
        originalProgress,
        originalGameProgress
      );

      // Parse backup
      const restored = parseBackupData(backupString);

      // Verify data integrity
      expect(restored.overallProgress?.overallCompletion).toBe(
        originalProgress.overallCompletion
      );
      expect(restored.overallProgress?.totalScore).toBe(
        originalProgress.totalScore
      );
      expect(restored.gameProgress).toHaveLength(2);
      expect(restored.gameProgress[0].completedLevels).toBe(4);
      expect(restored.gameProgress[0].achievements).toEqual([
        "first_artifact",
        "artifact_expert",
      ]);
      expect(restored.gameProgress[1].bestScore).toBe(78);
    });

    it("should handle concurrent progress updates", () => {
      const device1Progress = {
        overallProgress: {
          overallCompletion: 50,
          certificationStatus: "not_eligible" as const,
          lastActivity: Date.now() - 1000,
          totalGameTime: 100,
          totalScore: 800,
        },
        gameProgress: [
          {
            gameType: "artifact_identification" as const,
            completedLevels: 3,
            totalLevels: 5,
            bestScore: 85,
            averageScore: 80,
            timeSpent: 60,
            lastPlayed: Date.now() - 1000,
            achievements: ["first_artifact"],
          },
        ],
        syncTime: Date.now() - 1000,
      };

      const device2Progress = {
        overallProgress: {
          overallCompletion: 55,
          certificationStatus: "not_eligible" as const,
          lastActivity: Date.now(),
          totalGameTime: 110,
          totalScore: 850,
        },
        gameProgress: [
          {
            gameType: "artifact_identification" as const,
            completedLevels: 3,
            totalLevels: 5,
            bestScore: 88,
            averageScore: 82,
            timeSpent: 65,
            lastPlayed: Date.now(),
            achievements: ["first_artifact", "artifact_expert"],
          },
        ],
        syncTime: Date.now(),
      };

      // Device 2 has more recent data
      expect(device2Progress.syncTime).toBeGreaterThan(
        device1Progress.syncTime
      );
      expect(device2Progress.overallProgress.overallCompletion).toBeGreaterThan(
        device1Progress.overallProgress.overallCompletion
      );

      // Verify newer data should take precedence
      const diff = calculateProgressDiff(device1Progress, device2Progress);
      expect(diff.overallCompletionChange).toBe(5);
      expect(diff.newAchievements).toContain("artifact_expert");
    });
  });
});
