import { describe, it, expect } from "vitest";
import {
  EXCAVATION_PROTOCOLS,
  validateExcavationProtocols,
  getProtocolGuidance,
  calculateProtocolCompliance,
  ProtocolContext,
} from "../excavationProtocols";
import {
  ExcavationGameData,
  ExcavationTool,
  EnvironmentalConditions,
  SiteArtifact,
} from "../../types";
import { Id } from "../../../convex/_generated/dataModel";

describe("Excavation Protocols", () => {
  const mockSiteId = "test-site-id" as Id<"excavationSites">;
  const mockArtifactId = "test-artifact-id" as Id<"gameArtifacts">;

  const mockEnvironmentalConditions: EnvironmentalConditions = {
    visibility: 80,
    currentStrength: 3,
    temperature: 20,
    depth: 15,
    sedimentType: "sand",
    timeConstraints: 45,
  };

  const mockSiteArtifacts: SiteArtifact[] = [
    {
      artifactId: mockArtifactId,
      gridPosition: { x: 2, y: 2 },
      depth: 0.6,
      isDiscovered: false,
      condition: "poor",
    },
  ];

  const mockGameData: ExcavationGameData = {
    siteId: mockSiteId,
    currentTool: {
      id: "soft_brush",
      name: "Soft Brush",
      type: "brush",
      description: "Gentle cleaning tool",
      effectiveness: 0.8,
      appropriateFor: ["delicate", "fragile"],
    },
    discoveredArtifacts: [],
    excavatedCells: Array.from({ length: 25 }, (_, i) => ({
      x: i % 5,
      y: Math.floor(i / 5),
      excavated: false,
      excavationDepth: 0,
      containsArtifact: false,
    })),
    documentationEntries: [],
    timeRemaining: 2700, // 45 minutes
    protocolViolations: [],
  };

  const mockTool: ExcavationTool = {
    id: "hard_brush",
    name: "Hard Brush",
    type: "brush",
    description: "Sturdy brush",
    effectiveness: 0.6,
    appropriateFor: ["heavy_sediment"],
  };

  describe("Protocol Rule Validation", () => {
    it("should detect improper tool selection for poor visibility", () => {
      const context: ProtocolContext = {
        gameData: mockGameData,
        currentAction: {
          type: "excavation",
          gridX: 1,
          gridY: 1,
          tool: {
            id: "underwater_camera",
            name: "Underwater Camera",
            type: "camera",
            description: "Camera for documentation",
            effectiveness: 1.0,
            appropriateFor: ["photography"],
          },
        },
        environmentalConditions: {
          ...mockEnvironmentalConditions,
          visibility: 25,
        },
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 600,
      };

      const violations = validateExcavationProtocols(context);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].violationType).toBe("improper_tool");
      expect(violations[0].description).toContain("low visibility");
    });

    it("should detect improper tool selection for strong currents", () => {
      const context: ProtocolContext = {
        gameData: mockGameData,
        currentAction: {
          type: "excavation",
          gridX: 1,
          gridY: 1,
          tool: mockTool,
        },
        environmentalConditions: {
          ...mockEnvironmentalConditions,
          currentStrength: 8,
        },
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 600,
      };

      const violations = validateExcavationProtocols(context);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].violationType).toBe("improper_tool");
      expect(violations[0].description).toContain("strong currents");
    });

    it("should detect missing documentation before artifact removal", () => {
      const gameDataWithArtifact = {
        ...mockGameData,
        excavatedCells: mockGameData.excavatedCells.map((cell, index) =>
          index === 12 // Cell at position (2,2)
            ? { ...cell, containsArtifact: true, artifactId: mockArtifactId }
            : cell
        ),
      };

      const context: ProtocolContext = {
        gameData: gameDataWithArtifact,
        currentAction: {
          type: "excavation",
          gridX: 2,
          gridY: 2,
          tool: mockTool,
        },
        environmentalConditions: mockEnvironmentalConditions,
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 600,
      };

      const violations = validateExcavationProtocols(context);
      const docViolation = violations.find(
        (v) => v.violationType === "missing_documentation"
      );
      expect(docViolation).toBeDefined();
      expect(docViolation?.description).toContain("photographed and measured");
    });

    it("should detect scattered excavation pattern", () => {
      const gameDataWithScatteredExcavation = {
        ...mockGameData,
        excavatedCells: mockGameData.excavatedCells.map((cell, index) => {
          // Mark scattered cells as excavated (0,0), (4,4), (1,3), (3,1)
          const scatteredIndices = [0, 24, 8, 16];
          return scatteredIndices.includes(index)
            ? { ...cell, excavated: true }
            : cell;
        }),
      };

      const context: ProtocolContext = {
        gameData: gameDataWithScatteredExcavation,
        currentAction: {
          type: "excavation",
          gridX: 0,
          gridY: 4, // Another scattered position
          tool: mockTool,
        },
        environmentalConditions: mockEnvironmentalConditions,
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 600,
      };

      const violations = validateExcavationProtocols(context);
      const scatteredViolation = violations.find(
        (v) => v.violationType === "rushed_excavation"
      );
      expect(scatteredViolation).toBeDefined();
      expect(scatteredViolation?.description).toContain("scattered");
    });

    it("should detect poor time management", () => {
      const context: ProtocolContext = {
        gameData: { ...mockGameData, timeRemaining: 300 }, // Only 5 minutes left
        currentAction: {
          type: "excavation",
          gridX: 1,
          gridY: 1,
          tool: mockTool,
        },
        environmentalConditions: mockEnvironmentalConditions,
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 2400, // 40 minutes elapsed (80% of 45 minutes)
      };

      const violations = validateExcavationProtocols(context);
      const timeViolation = violations.find(
        (v) => v.violationType === "rushed_excavation"
      );
      expect(timeViolation).toBeDefined();
      expect(timeViolation?.description).toContain("Running out of time");
    });

    it("should detect artifact preservation violations", () => {
      const context: ProtocolContext = {
        gameData: mockGameData,
        currentAction: {
          type: "excavation",
          gridX: 2,
          gridY: 2, // Position with poor condition artifact
          tool: mockTool, // Hard brush on poor artifact
        },
        environmentalConditions: mockEnvironmentalConditions,
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 600,
      };

      const violations = validateExcavationProtocols(context);
      const damageViolation = violations.find(
        (v) => v.violationType === "damage"
      );
      expect(damageViolation).toBeDefined();
      expect(damageViolation?.description).toContain("fragile artifact");
    });

    it("should detect insufficient documentation frequency", () => {
      const context: ProtocolContext = {
        gameData: { ...mockGameData, documentationEntries: [] }, // No documentation
        currentAction: {
          type: "excavation",
          gridX: 1,
          gridY: 1,
          tool: mockTool,
        },
        environmentalConditions: mockEnvironmentalConditions,
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 1200, // 20 minutes elapsed (>25% of time)
      };

      const violations = validateExcavationProtocols(context);
      const docViolation = violations.find(
        (v) => v.violationType === "missing_documentation"
      );
      expect(docViolation).toBeDefined();
      expect(docViolation?.description).toContain("documentation frequency");
    });
  });

  describe("Protocol Guidance", () => {
    it("should provide time-based guidance when running short on time", () => {
      const gameDataLowTime = { ...mockGameData, timeRemaining: 600 }; // 10 minutes left
      const guidance = getProtocolGuidance(
        gameDataLowTime,
        mockEnvironmentalConditions
      );

      expect(guidance.some((g) => g.includes("Time is running short"))).toBe(
        true
      );
    });

    it("should provide visibility guidance in low visibility", () => {
      const lowVisibilityConditions = {
        ...mockEnvironmentalConditions,
        visibility: 40,
      };
      const guidance = getProtocolGuidance(
        mockGameData,
        lowVisibilityConditions
      );

      expect(guidance.some((g) => g.includes("Low visibility"))).toBe(true);
    });

    it("should provide current guidance in strong currents", () => {
      const strongCurrentConditions = {
        ...mockEnvironmentalConditions,
        currentStrength: 8,
      };
      const guidance = getProtocolGuidance(
        mockGameData,
        strongCurrentConditions
      );

      expect(guidance.some((g) => g.includes("Strong current"))).toBe(true);
    });

    it("should provide documentation guidance when incomplete", () => {
      const gameDataWithIncompleteDoc = {
        ...mockGameData,
        documentationEntries: [
          {
            id: "doc1",
            timestamp: new Date(),
            entryType: "discovery" as const,
            content: "Found artifact",
            gridPosition: { x: 1, y: 1 },
            isRequired: true,
            isComplete: false, // Incomplete
          },
        ],
      };

      const guidance = getProtocolGuidance(
        gameDataWithIncompleteDoc,
        mockEnvironmentalConditions
      );
      expect(
        guidance.some((g) => g.includes("Complete required documentation"))
      ).toBe(true);
    });

    it("should provide excavation pace guidance", () => {
      const gameDataSlowProgress = {
        ...mockGameData,
        timeRemaining: 1200, // Half time used
        excavatedCells: mockGameData.excavatedCells.map(
          (cell, index) => (index < 3 ? { ...cell, excavated: true } : cell) // Only 3/25 cells excavated (12%)
        ),
      };

      const guidance = getProtocolGuidance(
        gameDataSlowProgress,
        mockEnvironmentalConditions
      );
      expect(guidance.some((g) => g.includes("Increase excavation pace"))).toBe(
        true
      );
    });

    it("should provide artifact discovery guidance", () => {
      const gameDataNoArtifacts = {
        ...mockGameData,
        discoveredArtifacts: [], // No artifacts found
        excavatedCells: mockGameData.excavatedCells.map(
          (cell, index) => (index < 12 ? { ...cell, excavated: true } : cell) // 48% excavated
        ),
      };

      const guidance = getProtocolGuidance(
        gameDataNoArtifacts,
        mockEnvironmentalConditions
      );
      expect(guidance.some((g) => g.includes("No artifacts found yet"))).toBe(
        true
      );
    });
  });

  describe("Protocol Compliance Calculation", () => {
    it("should calculate perfect compliance with no violations", () => {
      const result = calculateProtocolCompliance(mockGameData);

      expect(result.score).toBe(100);
      expect(result.breakdown.severe).toBe(0);
      expect(result.breakdown.moderate).toBe(0);
      expect(result.breakdown.minor).toBe(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it("should calculate compliance with various violation types", () => {
      const gameDataWithViolations = {
        ...mockGameData,
        protocolViolations: [
          {
            id: "v1",
            timestamp: new Date(),
            violationType: "damage" as const,
            description: "Severe damage",
            severity: "severe" as const,
            pointsPenalty: 30,
          },
          {
            id: "v2",
            timestamp: new Date(),
            violationType: "improper_tool" as const,
            description: "Moderate violation",
            severity: "moderate" as const,
            pointsPenalty: 15,
          },
          {
            id: "v3",
            timestamp: new Date(),
            violationType: "rushed_excavation" as const,
            description: "Minor violation",
            severity: "minor" as const,
            pointsPenalty: 5,
          },
        ],
      };

      const result = calculateProtocolCompliance(gameDataWithViolations);

      expect(result.score).toBe(50); // 100 - 30 - 15 - 5 = 50
      expect(result.breakdown.severe).toBe(1);
      expect(result.breakdown.moderate).toBe(1);
      expect(result.breakdown.minor).toBe(1);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should provide appropriate recommendations based on violation types", () => {
      const gameDataWithSevereViolations = {
        ...mockGameData,
        protocolViolations: [
          {
            id: "v1",
            timestamp: new Date(),
            violationType: "damage" as const,
            description: "Artifact damage",
            severity: "severe" as const,
            pointsPenalty: 30,
          },
        ],
      };

      const result = calculateProtocolCompliance(gameDataWithSevereViolations);

      expect(
        result.recommendations.some((r) => r.includes("artifact preservation"))
      ).toBe(true);
      expect(
        result.recommendations.some((r) =>
          r.includes("documentation before artifact removal")
        )
      ).toBe(true);
    });

    it("should handle multiple moderate violations", () => {
      const gameDataWithModerateViolations = {
        ...mockGameData,
        protocolViolations: Array.from({ length: 3 }, (_, i) => ({
          id: `v${i}`,
          timestamp: new Date(),
          violationType: "improper_tool" as const,
          description: "Tool violation",
          severity: "moderate" as const,
          pointsPenalty: 15,
        })),
      };

      const result = calculateProtocolCompliance(
        gameDataWithModerateViolations
      );

      expect(result.breakdown.moderate).toBe(3);
      expect(
        result.recommendations.some((r) => r.includes("tool selection"))
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.includes("systematic excavation"))
      ).toBe(true);
    });

    it("should handle multiple minor violations", () => {
      const gameDataWithMinorViolations = {
        ...mockGameData,
        protocolViolations: Array.from({ length: 4 }, (_, i) => ({
          id: `v${i}`,
          timestamp: new Date(),
          violationType: "rushed_excavation" as const,
          description: "Minor violation",
          severity: "minor" as const,
          pointsPenalty: 5,
        })),
      };

      const result = calculateProtocolCompliance(gameDataWithMinorViolations);

      expect(result.breakdown.minor).toBe(4);
      expect(
        result.recommendations.some((r) => r.includes("time management"))
      ).toBe(true);
      expect(
        result.recommendations.some((r) =>
          r.includes("documentation frequency")
        )
      ).toBe(true);
    });

    it("should ensure score never goes below zero", () => {
      const gameDataWithManyViolations = {
        ...mockGameData,
        protocolViolations: Array.from({ length: 10 }, (_, i) => ({
          id: `v${i}`,
          timestamp: new Date(),
          violationType: "damage" as const,
          description: "Severe violation",
          severity: "severe" as const,
          pointsPenalty: 30,
        })),
      };

      const result = calculateProtocolCompliance(gameDataWithManyViolations);

      expect(result.score).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Protocol Rule Coverage", () => {
    it("should have all expected protocol categories", () => {
      const categories = EXCAVATION_PROTOCOLS.map((p) => p.category);
      const uniqueCategories = [...new Set(categories)];

      expect(uniqueCategories).toContain("safety");
      expect(uniqueCategories).toContain("documentation");
      expect(uniqueCategories).toContain("technique");
      expect(uniqueCategories).toContain("preservation");
    });

    it("should have protocols with different severity levels", () => {
      const severities = EXCAVATION_PROTOCOLS.map((p) => p.severity);
      const uniqueSeverities = [...new Set(severities)];

      expect(uniqueSeverities).toContain("minor");
      expect(uniqueSeverities).toContain("moderate");
      expect(uniqueSeverities).toContain("severe");
    });

    it("should have valid check functions for all protocols", () => {
      const mockContext: ProtocolContext = {
        gameData: mockGameData,
        currentAction: {
          type: "excavation",
          gridX: 1,
          gridY: 1,
          tool: mockTool,
        },
        environmentalConditions: mockEnvironmentalConditions,
        siteArtifacts: mockSiteArtifacts,
        timeElapsed: 600,
      };

      EXCAVATION_PROTOCOLS.forEach((protocol) => {
        expect(() => {
          protocol.checkFunction(mockContext);
        }).not.toThrow();
      });
    });
  });
});
