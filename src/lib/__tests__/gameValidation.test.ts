// Tests for game validation functions

import { describe, it, expect } from "vitest";
import { GameDataValidator } from "../gameValidation";

describe("GameDataValidator", () => {
  describe("validateArtifact", () => {
    it("should validate a correct artifact", () => {
      const validArtifact = {
        name: "Ancient Amphora",
        description: "A well-preserved ceramic vessel from the Roman period",
        historicalPeriod: "Roman Empire",
        culture: "Roman",
        dateRange: "100-200 CE",
        significance: "Important trade vessel indicating commercial activity",
        imageUrl: "https://example.com/amphora.jpg",
        discoveryLocation: "Mediterranean Sea, off coast of Italy",
        conservationNotes: "Excellent condition, minimal restoration needed",
        difficulty: "intermediate",
        category: "ceramics",
        isActive: true,
      };

      const result = GameDataValidator.validateArtifact(validArtifact);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject artifact with invalid data", () => {
      const invalidArtifact = {
        name: "", // Too short
        description: "Short", // Too short
        historicalPeriod: "Roman Empire",
        culture: "Roman",
        dateRange: "100-200 CE",
        significance: "Important trade vessel indicating commercial activity",
        imageUrl: "not-a-url", // Invalid URL
        discoveryLocation: "Mediterranean Sea, off coast of Italy",
        conservationNotes: "Excellent condition, minimal restoration needed",
        difficulty: "invalid-difficulty", // Invalid enum
        category: "ceramics",
        isActive: true,
      };

      const result = GameDataValidator.validateArtifact(invalidArtifact);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateExcavationSite", () => {
    it("should validate a correct excavation site", () => {
      const validSite = {
        name: "Shipwreck Site Alpha",
        location: "Mediterranean Sea",
        historicalPeriod: "Roman Empire",
        description: "Well-preserved merchant vessel from 2nd century CE",
        gridSize: { width: 10, height: 10 },
        difficulty: "intermediate",
        environmentalConditions: {
          visibility: 75,
          currentStrength: 3,
          temperature: 18,
          depth: 25,
          sedimentType: "sand",
          timeConstraints: 60,
        },
        siteArtifacts: [
          {
            artifactId: "artifact123",
            gridPosition: { x: 5, y: 5 },
            depth: 2,
            isDiscovered: false,
            condition: "good",
          },
        ],
        isActive: true,
      };

      const result = GameDataValidator.validateExcavationSite(validSite);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject site with artifacts outside grid bounds", () => {
      const invalidSite = {
        name: "Shipwreck Site Alpha",
        location: "Mediterranean Sea",
        historicalPeriod: "Roman Empire",
        description: "Well-preserved merchant vessel from 2nd century CE",
        gridSize: { width: 5, height: 5 },
        difficulty: "intermediate",
        environmentalConditions: {
          visibility: 75,
          currentStrength: 3,
          temperature: 18,
          depth: 25,
          sedimentType: "sand",
          timeConstraints: 60,
        },
        siteArtifacts: [
          {
            artifactId: "artifact123",
            gridPosition: { x: 10, y: 10 }, // Outside 5x5 grid
            depth: 2,
            isDiscovered: false,
            condition: "good",
          },
        ],
        isActive: true,
      };

      const result = GameDataValidator.validateExcavationSite(invalidSite);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) => error.includes("outside grid bounds"))
      ).toBe(true);
    });
  });

  describe("validateStudentProgress", () => {
    it("should validate correct student progress", () => {
      const validProgress = {
        userId: "user123",
        overallCompletion: 75,
        certificationStatus: "not_eligible",
        lastActivity: new Date(),
        totalGameTime: 120,
        totalScore: 850,
      };

      const result = GameDataValidator.validateStudentProgress(validProgress);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject certified status with low completion", () => {
      const invalidProgress = {
        userId: "user123",
        overallCompletion: 60, // Too low for certified status
        certificationStatus: "certified",
        lastActivity: new Date(),
        totalGameTime: 120,
        totalScore: 850,
      };

      const result = GameDataValidator.validateStudentProgress(invalidProgress);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes("Cannot be certified with less than 85% completion")
        )
      ).toBe(true);
    });
  });

  describe("utility functions", () => {
    it("should validate score ranges correctly", () => {
      expect(GameDataValidator.validateScoreRange(50, 100)).toBe(true);
      expect(GameDataValidator.validateScoreRange(0, 100)).toBe(true);
      expect(GameDataValidator.validateScoreRange(100, 100)).toBe(true);
      expect(GameDataValidator.validateScoreRange(-10, 100)).toBe(false);
      expect(GameDataValidator.validateScoreRange(110, 100)).toBe(false);
    });

    it("should validate time ranges correctly", () => {
      const startTime = new Date("2024-01-01T10:00:00Z");
      const endTime = new Date("2024-01-01T11:00:00Z");
      const invalidEndTime = new Date("2024-01-01T09:00:00Z");

      expect(GameDataValidator.validateTimeRange(startTime, endTime)).toBe(
        true
      );
      expect(GameDataValidator.validateTimeRange(startTime)).toBe(true); // No end time
      expect(
        GameDataValidator.validateTimeRange(startTime, invalidEndTime)
      ).toBe(false);
    });

    it("should validate completion percentages correctly", () => {
      expect(GameDataValidator.validateCompletionPercentage(5, 10)).toBe(true);
      expect(GameDataValidator.validateCompletionPercentage(0, 10)).toBe(true);
      expect(GameDataValidator.validateCompletionPercentage(10, 10)).toBe(true);
      expect(GameDataValidator.validateCompletionPercentage(15, 10)).toBe(
        false
      );
      expect(GameDataValidator.validateCompletionPercentage(5, 0)).toBe(false);
    });
  });
});
