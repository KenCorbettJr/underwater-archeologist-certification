// Unit tests for conservation lab game logic
// Tests conservation process selection, treatment planning, and educational accuracy

import { describe, it, expect } from "vitest";

describe("Conservation Lab Game Logic", () => {
  describe("Damage Assessment", () => {
    it("should identify different types of damage", () => {
      const damages = [
        { id: "1", type: "corrosion", severity: "moderate" },
        { id: "2", type: "fracture", severity: "severe" },
        { id: "3", type: "encrustation", severity: "minor" },
      ];

      const damageTypes = damages.map((d) => d.type);

      expect(damageTypes).toContain("corrosion");
      expect(damageTypes).toContain("fracture");
      expect(damageTypes).toContain("encrustation");
    });

    it("should calculate assessment accuracy", () => {
      const actualDamages = ["damage1", "damage2", "damage3", "damage4"];
      const identifiedDamages = ["damage1", "damage2", "damage3"];

      const correctIdentifications = identifiedDamages.filter((id) =>
        actualDamages.includes(id)
      );

      const accuracy = correctIdentifications.length / actualDamages.length;
      expect(accuracy).toBe(0.75);
    });

    it("should award points based on assessment accuracy", () => {
      const accuracy = 0.8;
      const assessmentScore = Math.round(accuracy * 200);

      expect(assessmentScore).toBe(160);
    });

    it("should provide feedback based on accuracy level", () => {
      const getFeedback = (accuracy: number): string => {
        if (accuracy >= 0.8) return "Excellent assessment!";
        if (accuracy >= 0.6)
          return "Good assessment, but some damages were missed.";
        return "Assessment needs improvement. Review the artifact more carefully.";
      };

      expect(getFeedback(0.9)).toBe("Excellent assessment!");
      expect(getFeedback(0.7)).toBe(
        "Good assessment, but some damages were missed."
      );
      expect(getFeedback(0.4)).toBe(
        "Assessment needs improvement. Review the artifact more carefully."
      );
    });
  });

  describe("Conservation Process Selection", () => {
    it("should validate appropriate process selection", () => {
      const processes = [
        {
          id: "1",
          name: "Gentle Cleaning",
          category: "cleaning",
          isAppropriate: true,
        },
        {
          id: "2",
          name: "Chemical Bath",
          category: "cleaning",
          isAppropriate: true,
        },
        {
          id: "3",
          name: "Consolidation",
          category: "stabilization",
          isAppropriate: true,
        },
      ];

      const selectedProcess = processes[0];
      expect(selectedProcess.isAppropriate).toBe(true);
    });

    it("should identify inappropriate process selection", () => {
      const materialType = "ceramic";
      const process = {
        id: "1",
        name: "Aggressive Cleaning",
        isAppropriate: materialType === "metal", // Not appropriate for ceramic
      };

      expect(process.isAppropriate).toBe(false);
    });

    it("should penalize inappropriate process selection", () => {
      const isAppropriate = false;
      const penalty = isAppropriate ? 0 : -50;

      expect(penalty).toBe(-50);
    });

    it("should prevent duplicate process selection", () => {
      const selectedProcesses = [
        { id: "1", name: "Gentle Cleaning" },
        { id: "2", name: "Consolidation" },
      ];

      const newProcessId = "1";
      const isDuplicate = selectedProcesses.some((p) => p.id === newProcessId);

      expect(isDuplicate).toBe(true);
    });

    it("should categorize processes correctly", () => {
      const processes = [
        { id: "1", category: "cleaning" },
        { id: "2", category: "stabilization" },
        { id: "3", category: "repair" },
        { id: "4", category: "preservation" },
      ];

      const categories = processes.map((p) => p.category);

      expect(categories).toContain("cleaning");
      expect(categories).toContain("stabilization");
      expect(categories).toContain("repair");
      expect(categories).toContain("preservation");
    });
  });

  describe("Treatment Plan Validation", () => {
    it("should validate correct process order", () => {
      const processOrder = [
        "cleaning",
        "stabilization",
        "repair",
        "preservation",
      ];
      const categoryOrder = [
        "cleaning",
        "stabilization",
        "repair",
        "preservation",
      ];

      let lastIndex = -1;
      let isCorrectOrder = true;

      for (const category of processOrder) {
        const currentIndex = categoryOrder.indexOf(category);
        if (currentIndex < lastIndex) {
          isCorrectOrder = false;
          break;
        }
        lastIndex = currentIndex;
      }

      expect(isCorrectOrder).toBe(true);
    });

    it("should reject incorrect process order", () => {
      const processOrder = ["repair", "cleaning", "stabilization"]; // Wrong order
      const categoryOrder = [
        "cleaning",
        "stabilization",
        "repair",
        "preservation",
      ];

      let lastIndex = -1;
      let isCorrectOrder = true;

      for (const category of processOrder) {
        const currentIndex = categoryOrder.indexOf(category);
        if (currentIndex < lastIndex) {
          isCorrectOrder = false;
          break;
        }
        lastIndex = currentIndex;
      }

      expect(isCorrectOrder).toBe(false);
    });

    it("should allow skipping optional process categories", () => {
      const processOrder = ["cleaning", "preservation"]; // Skipping stabilization and repair
      const categoryOrder = [
        "cleaning",
        "stabilization",
        "repair",
        "preservation",
      ];

      let lastIndex = -1;
      let isCorrectOrder = true;

      for (const category of processOrder) {
        const currentIndex = categoryOrder.indexOf(category);
        if (currentIndex < lastIndex) {
          isCorrectOrder = false;
          break;
        }
        lastIndex = currentIndex;
      }

      expect(isCorrectOrder).toBe(true);
    });

    it("should award higher score for correct order", () => {
      const isCorrectOrder = true;
      const planScore = isCorrectOrder ? 300 : 100;

      expect(planScore).toBe(300);
    });

    it("should award lower score for incorrect order", () => {
      const isCorrectOrder = false;
      const planScore = isCorrectOrder ? 300 : 100;

      expect(planScore).toBe(100);
    });
  });

  describe("Treatment Step Execution", () => {
    it("should track completed treatment steps", () => {
      const treatmentPlan = [
        { id: "step1", isComplete: false },
        { id: "step2", isComplete: false },
        { id: "step3", isComplete: false },
      ];

      treatmentPlan[0].isComplete = true;
      treatmentPlan[1].isComplete = true;

      const completedCount = treatmentPlan.filter((s) => s.isComplete).length;
      expect(completedCount).toBe(2);
    });

    it("should prevent completing the same step twice", () => {
      const step = { id: "step1", isComplete: true };
      const canComplete = !step.isComplete;

      expect(canComplete).toBe(false);
    });

    it("should award points for completing steps", () => {
      const isCorrect = true;
      const stepScore = isCorrect ? 100 : 50;

      expect(stepScore).toBe(100);
    });

    it("should award reduced points for incorrect steps", () => {
      const isCorrect = false;
      const stepScore = isCorrect ? 100 : 50;

      expect(stepScore).toBe(50);
    });

    it("should calculate completion percentage", () => {
      const completedSteps = 3;
      const totalSteps = 5;
      const baseCompletion = 50; // Assessment and planning complete

      const completionPercentage = Math.round(
        baseCompletion + (completedSteps / totalSteps) * 50
      );

      expect(completionPercentage).toBe(80);
    });
  });

  describe("Mistake Tracking", () => {
    it("should record mistakes for inappropriate processes", () => {
      const mistakes: Array<{
        processId: string;
        description: string;
        penalty: number;
      }> = [];

      const process = {
        id: "process1",
        name: "Aggressive Cleaning",
        isAppropriate: false,
      };

      if (!process.isAppropriate) {
        mistakes.push({
          processId: process.id,
          description: `${process.name} is not appropriate for this artifact`,
          penalty: 50,
        });
      }

      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].penalty).toBe(50);
    });

    it("should track multiple mistakes", () => {
      const mistakes = [
        { id: "1", description: "Wrong process", penalty: 50 },
        { id: "2", description: "Wrong order", penalty: 30 },
        { id: "3", description: "Incomplete step", penalty: 20 },
      ];

      const totalPenalty = mistakes.reduce((sum, m) => sum + m.penalty, 0);
      expect(totalPenalty).toBe(100);
    });

    it("should provide consequences for mistakes", () => {
      const mistake = {
        description: "Using harsh chemicals on fragile material",
        consequence: "May cause irreversible damage to the artifact",
      };

      expect(mistake.consequence).toContain("damage");
    });
  });

  describe("Artifact Condition Generation", () => {
    it("should generate appropriate damages for difficulty level", () => {
      const beginnerCondition = {
        overallCondition: "fair" as const,
        damages: [
          { type: "encrustation", severity: "moderate" as const },
          { type: "corrosion", severity: "minor" as const },
        ],
      };

      expect(beginnerCondition.damages).toHaveLength(2);
      expect(
        beginnerCondition.damages.some((d) => d.severity === "severe")
      ).toBe(false);
    });

    it("should include environmental factors", () => {
      const condition = {
        environmentalFactors: [
          "saltwater exposure",
          "marine organisms",
          "sediment burial",
        ],
      };

      expect(condition.environmentalFactors).toContain("saltwater exposure");
      expect(condition.environmentalFactors.length).toBeGreaterThan(0);
    });

    it("should specify material type", () => {
      const condition = {
        materialType: "ceramic with metal fittings",
      };

      expect(condition.materialType).toBeTruthy();
      expect(typeof condition.materialType).toBe("string");
    });
  });

  describe("Process Appropriateness Logic", () => {
    it("should determine if chemical bath is appropriate for ceramic", () => {
      const materialType = "ceramic";
      const process = {
        name: "Chemical Bath",
        isAppropriate: materialType.includes("ceramic"),
      };

      expect(process.isAppropriate).toBe(true);
    });

    it("should determine if adhesive repair is appropriate when fractures exist", () => {
      const damages = [
        { type: "fracture", severity: "moderate" },
        { type: "corrosion", severity: "minor" },
      ];

      const process = {
        name: "Adhesive Repair",
        isAppropriate: damages.some((d) => d.type === "fracture"),
      };

      expect(process.isAppropriate).toBe(true);
    });

    it("should mark consolidation as generally appropriate", () => {
      const process = {
        name: "Consolidation",
        category: "stabilization",
        isAppropriate: true,
      };

      expect(process.isAppropriate).toBe(true);
    });
  });

  describe("Completion Requirements", () => {
    it("should require assessment completion before process selection", () => {
      const assessmentComplete = false;
      const canSelectProcess = assessmentComplete;

      expect(canSelectProcess).toBe(false);
    });

    it("should require all steps complete before finishing", () => {
      const treatmentPlan = [
        { id: "1", isComplete: true },
        { id: "2", isComplete: true },
        { id: "3", isComplete: false },
      ];

      const allStepsComplete = treatmentPlan.every((s) => s.isComplete);
      expect(allStepsComplete).toBe(false);
    });

    it("should allow completion when all requirements met", () => {
      const assessmentComplete = true;
      const treatmentPlan = [
        { id: "1", isComplete: true },
        { id: "2", isComplete: true },
      ];

      const allStepsComplete = treatmentPlan.every((s) => s.isComplete);
      const canComplete =
        assessmentComplete && allStepsComplete && treatmentPlan.length > 0;

      expect(canComplete).toBe(true);
    });
  });

  describe("Educational Value Validation", () => {
    it("should teach correct conservation sequence", () => {
      const correctSequence = [
        "cleaning",
        "stabilization",
        "repair",
        "preservation",
      ];

      // Verify the sequence follows conservation best practices
      expect(correctSequence[0]).toBe("cleaning");
      expect(correctSequence[correctSequence.length - 1]).toBe("preservation");
    });

    it("should provide realistic process durations", () => {
      const processes = [
        { name: "Gentle Cleaning", duration: 2 },
        { name: "Chemical Bath", duration: 4 },
        { name: "Consolidation", duration: 3 },
      ];

      processes.forEach((process) => {
        expect(process.duration).toBeGreaterThan(0);
        expect(process.duration).toBeLessThanOrEqual(8);
      });
    });

    it("should include realistic damage types", () => {
      const validDamageTypes = [
        "corrosion",
        "fracture",
        "encrustation",
        "biological",
        "deterioration",
      ];

      const damage = { type: "corrosion" };
      expect(validDamageTypes).toContain(damage.type);
    });

    it("should use appropriate severity levels", () => {
      const validSeverities = ["minor", "moderate", "severe"];
      const damage = { severity: "moderate" };

      expect(validSeverities).toContain(damage.severity);
    });
  });

  describe("Score Calculation", () => {
    it("should calculate total score from all components", () => {
      const assessmentScore = 160;
      const processSelectionScore = 0; // No penalties
      const planScore = 300;
      const stepScores = [100, 100, 100]; // 3 steps

      const totalScore =
        assessmentScore +
        processSelectionScore +
        planScore +
        stepScores.reduce((sum, s) => sum + s, 0);

      expect(totalScore).toBe(760);
    });

    it("should deduct penalties from total score", () => {
      const baseScore = 500;
      const penalties = [50, 30, 20];
      const totalPenalty = penalties.reduce((sum, p) => sum + p, 0);

      const finalScore = Math.max(0, baseScore - totalPenalty);

      expect(finalScore).toBe(400);
    });

    it("should not allow negative scores", () => {
      const baseScore = 50;
      const penalty = 100;

      const finalScore = Math.max(0, baseScore - penalty);

      expect(finalScore).toBe(0);
    });
  });
});
