import { describe, it, expect } from "vitest";
import {
  initializeExcavationGame,
  processExcavationAction,
  addDocumentationEntry,
  generateSiteReport,
  EXCAVATION_TOOLS,
} from "../excavationGameLogic";
import {
  ExcavationGameData,
  SiteArtifact,
  EnvironmentalConditions,
} from "../../types";
import { Id } from "../../../convex/_generated/dataModel";

describe("Excavation Game Logic", () => {
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
      condition: "good",
    },
  ];

  it("should initialize excavation game correctly", () => {
    const gameData = initializeExcavationGame(mockSiteId, 5, 5, 45);

    expect(gameData.siteId).toBe(mockSiteId);
    expect(gameData.excavatedCells).toHaveLength(25); // 5x5 grid
    expect(gameData.timeRemaining).toBe(45 * 60); // 45 minutes in seconds
    expect(gameData.discoveredArtifacts).toHaveLength(0);
    expect(gameData.documentationEntries).toHaveLength(0);
    expect(gameData.protocolViolations).toHaveLength(0);
  });

  it("should process excavation action correctly", () => {
    const gameData = initializeExcavationGame(mockSiteId, 5, 5, 45);
    const tool = EXCAVATION_TOOLS[0]; // Soft brush

    const result = processExcavationAction(
      gameData,
      1,
      1, // Grid position without artifact
      tool,
      mockSiteArtifacts,
      mockEnvironmentalConditions
    );

    expect(result.success).toBe(true);
    expect(result.discoveries).toHaveLength(0); // No artifact at this position
    expect(
      result.newGameData.excavatedCells[6].excavationDepth
    ).toBeGreaterThan(0); // Cell 1,1 in 5x5 grid
  });

  it("should discover artifact when excavating deep enough", () => {
    const gameData = initializeExcavationGame(mockSiteId, 5, 5, 45);
    const tool = EXCAVATION_TOOLS.find((t) => t.id === "trowel")!; // More effective tool

    // Excavate multiple times to reach artifact depth
    let currentGameData = gameData;
    let result;

    for (let i = 0; i < 10; i++) {
      result = processExcavationAction(
        currentGameData,
        2,
        2, // Position with artifact
        tool,
        mockSiteArtifacts,
        mockEnvironmentalConditions
      );
      currentGameData = result.newGameData;

      if (result.discoveries.length > 0) {
        break;
      }
    }

    expect(result!.discoveries.length).toBeGreaterThan(0);
    expect(currentGameData.discoveredArtifacts).toContain(mockArtifactId);
  });

  it("should add documentation entry correctly", () => {
    const gameData = initializeExcavationGame(mockSiteId, 5, 5, 45);

    const updatedGameData = addDocumentationEntry(gameData, {
      entryType: "discovery",
      content: "Found pottery fragment",
      gridPosition: { x: 2, y: 2 },
      isRequired: true,
      isComplete: true,
    });

    expect(updatedGameData.documentationEntries).toHaveLength(1);
    expect(updatedGameData.documentationEntries[0].entryType).toBe("discovery");
    expect(updatedGameData.documentationEntries[0].content).toBe(
      "Found pottery fragment"
    );
  });

  it("should generate site report correctly", () => {
    const gameData = initializeExcavationGame(mockSiteId, 5, 5, 45);

    // Simulate some excavation progress
    gameData.excavatedCells[0].excavated = true;
    gameData.excavatedCells[1].excavated = true;
    gameData.excavatedCells[2].excavated = true;

    // Add discovered artifact
    gameData.discoveredArtifacts.push(mockArtifactId);

    // Add documentation
    gameData.documentationEntries.push({
      id: "doc1",
      timestamp: new Date(),
      entryType: "discovery",
      content: "Test discovery",
      gridPosition: { x: 0, y: 0 },
      isRequired: true,
      isComplete: true,
    });

    const report = generateSiteReport(gameData, "Test Site", mockSiteArtifacts);

    expect(report.completionPercentage).toBe(12); // 3/25 cells = 12%
    expect(report.artifactsFound).toBe(1);
    expect(report.totalArtifacts).toBe(1);
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.recommendations).toBeInstanceOf(Array);
  });

  it("should validate tool usage correctly", () => {
    const gameData = initializeExcavationGame(mockSiteId, 5, 5, 45);
    const hardBrush = EXCAVATION_TOOLS.find((t) => t.id === "hard_brush")!;

    // Create poor condition artifact
    const poorArtifacts: SiteArtifact[] = [
      {
        artifactId: mockArtifactId,
        gridPosition: { x: 1, y: 1 },
        depth: 0.3,
        isDiscovered: false,
        condition: "poor",
      },
    ];

    const result = processExcavationAction(
      gameData,
      1,
      1,
      hardBrush,
      poorArtifacts,
      mockEnvironmentalConditions
    );

    // Should generate violation for using hard brush on poor condition artifact
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].violationType).toBe("improper_tool");
  });
});
