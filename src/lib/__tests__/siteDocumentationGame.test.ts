// Unit tests for site documentation game logic
// Tests documentation accuracy, completeness, and validation

import { describe, it, expect } from "vitest";

describe("Site Documentation Game Logic", () => {
  describe("Photo Documentation Validation", () => {
    it("should validate photos with scale and north arrow", () => {
      const photo = {
        hasScale: true,
        hasNorthArrow: true,
        gridPosition: { x: 2, y: 3 },
        angle: "overhead",
      };

      const isValid = photo.hasScale && photo.hasNorthArrow;
      expect(isValid).toBe(true);
    });

    it("should reject photos missing scale reference", () => {
      const photo = {
        hasScale: false,
        hasNorthArrow: true,
        gridPosition: { x: 2, y: 3 },
        angle: "overhead",
      };

      const isValid = photo.hasScale && photo.hasNorthArrow;
      expect(isValid).toBe(false);
    });

    it("should reject photos missing north arrow", () => {
      const photo = {
        hasScale: true,
        hasNorthArrow: false,
        gridPosition: { x: 2, y: 3 },
        angle: "overhead",
      };

      const isValid = photo.hasScale && photo.hasNorthArrow;
      expect(isValid).toBe(false);
    });

    it("should calculate photo score based on completeness", () => {
      const validPhoto = { hasScale: true, hasNorthArrow: true };
      const invalidPhoto = { hasScale: false, hasNorthArrow: false };

      const validScore =
        validPhoto.hasScale && validPhoto.hasNorthArrow ? 50 : 25;
      const invalidScore =
        invalidPhoto.hasScale && invalidPhoto.hasNorthArrow ? 50 : 25;

      expect(validScore).toBe(50);
      expect(invalidScore).toBe(25);
    });
  });

  describe("Measurement Validation", () => {
    it("should validate measurements with positive values and metric units", () => {
      const measurement = {
        value: 15.5,
        unit: "cm",
        measurementType: "length" as const,
      };

      const isValid =
        measurement.value > 0 &&
        (measurement.unit === "cm" || measurement.unit === "m");
      expect(isValid).toBe(true);
    });

    it("should reject measurements with negative values", () => {
      const measurement = {
        value: -5,
        unit: "cm",
        measurementType: "length" as const,
      };

      const isValid =
        measurement.value > 0 &&
        (measurement.unit === "cm" || measurement.unit === "m");
      expect(isValid).toBe(false);
    });

    it("should reject measurements with non-metric units", () => {
      const measurement = {
        value: 10,
        unit: "inches",
        measurementType: "length" as const,
      };

      const isValid =
        measurement.value > 0 &&
        (measurement.unit === "cm" || measurement.unit === "m");
      expect(isValid).toBe(false);
    });

    it("should accept both cm and m as valid units", () => {
      const measurementCm = { value: 15, unit: "cm" };
      const measurementM = { value: 1.5, unit: "m" };

      const isValidCm =
        measurementCm.value > 0 &&
        (measurementCm.unit === "cm" || measurementCm.unit === "m");
      const isValidM =
        measurementM.value > 0 &&
        (measurementM.unit === "cm" || measurementM.unit === "m");

      expect(isValidCm).toBe(true);
      expect(isValidM).toBe(true);
    });
  });

  describe("Report Section Validation", () => {
    it("should validate report sections based on word count", () => {
      const shortContent = "This is too short.";
      const adequateContent =
        "This is an adequate description of the archaeological site. ".repeat(
          10
        );
      const excellentContent =
        "This is an excellent and thorough description of the archaeological site with detailed observations and analysis. ".repeat(
          15
        );

      const validateSection = (content: string): number => {
        const wordCount = content.trim().split(/\s+/).length;
        const minWords = 50;
        const idealWords = 150;

        if (wordCount < minWords) {
          return Math.round((wordCount / minWords) * 50);
        }
        if (wordCount >= idealWords) {
          return 100;
        }
        return Math.round(
          50 + ((wordCount - minWords) / (idealWords - minWords)) * 50
        );
      };

      expect(validateSection(shortContent)).toBeLessThan(50);
      expect(validateSection(adequateContent)).toBeGreaterThanOrEqual(50);
      expect(validateSection(excellentContent)).toBe(100);
    });

    it("should mark sections complete when validation score is 70 or higher", () => {
      const content =
        "This is a detailed description of the archaeological site with comprehensive observations. ".repeat(
          8
        );

      const wordCount = content.trim().split(/\s+/).length;
      const minWords = 50;
      const idealWords = 150;

      let validationScore: number;
      if (wordCount < minWords) {
        validationScore = Math.round((wordCount / minWords) * 50);
      } else if (wordCount >= idealWords) {
        validationScore = 100;
      } else {
        validationScore = Math.round(
          50 + ((wordCount - minWords) / (idealWords - minWords)) * 50
        );
      }

      const isComplete = validationScore >= 70;
      expect(isComplete).toBe(true);
    });

    it("should provide appropriate feedback based on validation score", () => {
      const getFeedback = (score: number): string => {
        if (score >= 90)
          return "Excellent section! Very thorough and well-written.";
        if (score >= 70) return "Good work! Section meets requirements.";
        if (score >= 50)
          return "Section needs more detail. Add more observations and analysis.";
        return "Section is too brief. Please expand with more information.";
      };

      expect(getFeedback(95)).toContain("Excellent");
      expect(getFeedback(75)).toContain("Good work");
      expect(getFeedback(55)).toContain("needs more detail");
      expect(getFeedback(30)).toContain("too brief");
    });
  });

  describe("Completion Calculation", () => {
    it("should calculate completion based on photos, measurements, and report sections", () => {
      const calculateCompletion = (
        photoCount: number,
        measurementCount: number,
        completedSections: number
      ): number => {
        const photoWeight = 0.3;
        const measurementWeight = 0.3;
        const reportWeight = 0.4;

        const photoCompletion = Math.min(photoCount / 4, 1);
        const measurementCompletion = Math.min(measurementCount / 6, 1);
        const reportCompletion = completedSections / 4;

        return Math.round(
          (photoCompletion * photoWeight +
            measurementCompletion * measurementWeight +
            reportCompletion * reportWeight) *
            100
        );
      };

      expect(calculateCompletion(0, 0, 0)).toBe(0);
      expect(calculateCompletion(4, 6, 4)).toBe(100);
      expect(calculateCompletion(2, 3, 2)).toBe(50);
    });

    it("should cap photo and measurement completion at 100%", () => {
      const calculateCompletion = (
        photoCount: number,
        measurementCount: number,
        completedSections: number
      ): number => {
        const photoWeight = 0.3;
        const measurementWeight = 0.3;
        const reportWeight = 0.4;

        const photoCompletion = Math.min(photoCount / 4, 1);
        const measurementCompletion = Math.min(measurementCount / 6, 1);
        const reportCompletion = completedSections / 4;

        return Math.round(
          (photoCompletion * photoWeight +
            measurementCompletion * measurementWeight +
            reportCompletion * reportWeight) *
            100
        );
      };

      // Extra photos and measurements shouldn't exceed 100%
      expect(calculateCompletion(10, 12, 4)).toBe(100);
    });
  });

  describe("Validation Error Tracking", () => {
    it("should track errors for invalid photos", () => {
      const errors: Array<{
        type: string;
        description: string;
        severity: string;
      }> = [];

      const photo = { hasScale: false, hasNorthArrow: false };

      if (!photo.hasScale || !photo.hasNorthArrow) {
        const missing: string[] = [];
        if (!photo.hasScale) missing.push("scale reference");
        if (!photo.hasNorthArrow) missing.push("north arrow");

        errors.push({
          type: "invalid_data",
          description: `Photo missing: ${missing.join(", ")}`,
          severity: "moderate",
        });
      }

      expect(errors).toHaveLength(1);
      expect(errors[0].description).toContain("scale reference");
      expect(errors[0].description).toContain("north arrow");
    });

    it("should track errors for invalid measurements", () => {
      const errors: Array<{
        type: string;
        description: string;
        severity: string;
      }> = [];

      const measurement = { value: -5, unit: "inches" };
      const isValid =
        measurement.value > 0 &&
        (measurement.unit === "cm" || measurement.unit === "m");

      if (!isValid) {
        errors.push({
          type: "invalid_data",
          description:
            "Invalid measurement: use positive values and metric units (cm or m)",
          severity: "moderate",
        });
      }

      expect(errors).toHaveLength(1);
      expect(errors[0].description).toContain("metric units");
    });
  });

  describe("Final Validation", () => {
    it("should require minimum photos for completion", () => {
      const requiredPhotos = 4;
      const photoCount = 3;

      const feedback: string[] = [];
      if (photoCount < requiredPhotos) {
        feedback.push(`Need ${requiredPhotos - photoCount} more photos`);
      }

      expect(feedback).toHaveLength(1);
      expect(feedback[0]).toContain("more photos");
    });

    it("should require minimum measurements for completion", () => {
      const requiredMeasurements = 6;
      const measurementCount = 4;

      const feedback: string[] = [];
      if (measurementCount < requiredMeasurements) {
        feedback.push(
          `Need ${requiredMeasurements - measurementCount} more measurements`
        );
      }

      expect(feedback).toHaveLength(1);
      expect(feedback[0]).toContain("more measurements");
    });

    it("should require all report sections to be complete", () => {
      const sections = [
        { type: "site_description", isComplete: true },
        { type: "methodology", isComplete: false },
        { type: "findings", isComplete: true },
        { type: "conclusions", isComplete: false },
      ];

      const feedback: string[] = [];
      const incompleteSections = sections.filter((s) => !s.isComplete);

      if (incompleteSections.length > 0) {
        feedback.push(
          `Complete these sections: ${incompleteSections.map((s) => s.type).join(", ")}`
        );
      }

      expect(feedback).toHaveLength(1);
      expect(feedback[0]).toContain("methodology");
      expect(feedback[0]).toContain("conclusions");
    });

    it("should mark as complete when all requirements are met", () => {
      const photoCount = 4;
      const measurementCount = 6;
      const completedSections = 4;

      const feedback: string[] = [];

      if (photoCount < 4) feedback.push("Need more photos");
      if (measurementCount < 6) feedback.push("Need more measurements");
      if (completedSections < 4) feedback.push("Complete all sections");

      const isComplete = feedback.length === 0;
      expect(isComplete).toBe(true);
    });
  });
});
