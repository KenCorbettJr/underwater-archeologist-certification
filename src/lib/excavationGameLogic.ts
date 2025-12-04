import {
  ExcavationGameData,
  ExcavationTool,
  GridCell,
  DocumentationEntry,
  ProtocolViolation,
  EnvironmentalConditions,
  SiteArtifact,
  DifficultyLevel,
} from "../types";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Excavation game logic and utilities
 */

// Standard excavation tools available in the game
export const EXCAVATION_TOOLS: ExcavationTool[] = [
  {
    id: "soft_brush",
    name: "Soft Brush",
    type: "brush",
    description: "Gentle cleaning tool for delicate artifacts",
    effectiveness: 0.8,
    appropriateFor: ["delicate", "fragile", "detailed_cleaning"],
  },
  {
    id: "hard_brush",
    name: "Hard Brush",
    type: "brush",
    description: "Sturdy brush for removing sediment",
    effectiveness: 0.6,
    appropriateFor: ["heavy_sediment", "initial_cleaning", "robust_artifacts"],
  },
  {
    id: "trowel",
    name: "Archaeological Trowel",
    type: "trowel",
    description: "Precision tool for careful excavation",
    effectiveness: 0.9,
    appropriateFor: [
      "precision_work",
      "artifact_extraction",
      "grid_excavation",
    ],
  },
  {
    id: "measuring_tape",
    name: "Measuring Tape",
    type: "measuring_tape",
    description: "For accurate measurements and grid mapping",
    effectiveness: 1.0,
    appropriateFor: ["documentation", "mapping", "measurements"],
  },
  {
    id: "underwater_camera",
    name: "Underwater Camera",
    type: "camera",
    description: "Waterproof camera for site documentation",
    effectiveness: 1.0,
    appropriateFor: ["photography", "documentation", "evidence"],
  },
  {
    id: "sieve",
    name: "Archaeological Sieve",
    type: "sieve",
    description: "For separating small artifacts from sediment",
    effectiveness: 0.7,
    appropriateFor: [
      "small_artifacts",
      "sediment_processing",
      "thorough_search",
    ],
  },
  {
    id: "probe",
    name: "Archaeological Probe",
    type: "probe",
    description: "For detecting buried objects without damage",
    effectiveness: 0.5,
    appropriateFor: ["detection", "preliminary_survey", "safe_exploration"],
  },
];

/**
 * Initialize a new excavation game session
 */
export function initializeExcavationGame(
  siteId: Id<"excavationSites">,
  gridWidth: number,
  gridHeight: number,
  timeLimit: number
): ExcavationGameData {
  const excavatedCells: GridCell[] = [];

  // Initialize all grid cells as unexcavated
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      excavatedCells.push({
        x,
        y,
        excavated: false,
        excavationDepth: 0,
        containsArtifact: false,
      });
    }
  }

  return {
    siteId,
    currentTool: EXCAVATION_TOOLS[0], // Start with soft brush
    discoveredArtifacts: [],
    excavatedCells,
    documentationEntries: [],
    protocolViolations: [],
  };
}

/**
 * Validate if a tool is appropriate for the current action
 */
export function validateToolUsage(
  tool: ExcavationTool,
  actionType: string,
  conditions: EnvironmentalConditions,
  artifactCondition?: string
): { isValid: boolean; reason?: string } {
  // Check if tool is appropriate for the action
  const isAppropriate = tool.appropriateFor.some(
    (use) => actionType.includes(use) || use === "general"
  );

  if (!isAppropriate) {
    return {
      isValid: false,
      reason: `${tool.name} is not appropriate for ${actionType}. Consider using a different tool.`,
    };
  }

  // Check environmental conditions
  if (conditions.visibility < 30 && tool.type === "camera") {
    return {
      isValid: false,
      reason:
        "Visibility too low for photography. Improve lighting or wait for better conditions.",
    };
  }

  if (conditions.currentStrength > 6 && tool.type === "brush") {
    return {
      isValid: false,
      reason:
        "Current too strong for brush work. Use a more stable tool or wait for calmer conditions.",
    };
  }

  // Check artifact condition compatibility
  if (artifactCondition === "poor" && tool.id === "hard_brush") {
    return {
      isValid: false,
      reason:
        "Artifact is too fragile for hard brush. Use soft brush or trowel instead.",
    };
  }

  return { isValid: true };
}

/**
 * Process excavation action on a grid cell
 */
export function processExcavationAction(
  gameData: ExcavationGameData,
  gridX: number,
  gridY: number,
  tool: ExcavationTool,
  siteArtifacts: SiteArtifact[],
  conditions: EnvironmentalConditions
): {
  success: boolean;
  newGameData: ExcavationGameData;
  discoveries: string[];
  violations: ProtocolViolation[];
  score: number;
} {
  const cellIndex = gameData.excavatedCells.findIndex(
    (cell) => cell.x === gridX && cell.y === gridY
  );

  if (cellIndex === -1) {
    return {
      success: false,
      newGameData: gameData,
      discoveries: [],
      violations: [],
      score: 0,
    };
  }

  const cell = { ...gameData.excavatedCells[cellIndex] };
  const newGameData = { ...gameData };
  const discoveries: string[] = [];
  const violations: ProtocolViolation[] = [];
  let score = 0;

  // Check if there's an artifact at this position
  const artifactAtPosition = siteArtifacts.find(
    (artifact) =>
      artifact.gridPosition.x === gridX && artifact.gridPosition.y === gridY
  );

  // Validate tool usage
  const toolValidation = validateToolUsage(
    tool,
    "excavation",
    conditions,
    artifactAtPosition?.condition
  );

  if (!toolValidation.isValid) {
    violations.push({
      id: `violation_${Date.now()}`,
      timestamp: new Date(),
      violationType: "improper_tool",
      description: toolValidation.reason || "Improper tool usage",
      severity: "moderate",
      pointsPenalty: 10,
    });
  }

  // Process excavation based on tool effectiveness and conditions
  const excavationProgress = calculateExcavationProgress(tool, conditions);
  cell.excavationDepth = Math.min(1, cell.excavationDepth + excavationProgress);

  if (cell.excavationDepth > 0.3) {
    cell.excavated = true;
  }

  // Check for artifact discovery
  if (artifactAtPosition && cell.excavationDepth >= artifactAtPosition.depth) {
    if (!cell.containsArtifact) {
      cell.containsArtifact = true;
      cell.artifactId = artifactAtPosition.artifactId;

      if (
        !newGameData.discoveredArtifacts.includes(artifactAtPosition.artifactId)
      ) {
        newGameData.discoveredArtifacts.push(artifactAtPosition.artifactId);
        discoveries.push(
          `Artifact discovered at position (${gridX}, ${gridY})`
        );
        score += calculateDiscoveryScore(artifactAtPosition, tool, conditions);
      }
    }
  }

  // Update game data
  newGameData.excavatedCells[cellIndex] = cell;
  newGameData.protocolViolations.push(...violations);

  return {
    success: true,
    newGameData,
    discoveries,
    violations,
    score,
  };
}

/**
 * Add documentation entry
 */
export function addDocumentationEntry(
  gameData: ExcavationGameData,
  entry: Omit<DocumentationEntry, "id" | "timestamp">
): ExcavationGameData {
  const newEntry: DocumentationEntry = {
    ...entry,
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };

  return {
    ...gameData,
    documentationEntries: [...gameData.documentationEntries, newEntry],
  };
}

/**
 * Check if proper documentation protocols are being followed
 */
export function validateDocumentationProtocol(
  gameData: ExcavationGameData,
  requiredEntries: string[]
): ProtocolViolation[] {
  const violations: ProtocolViolation[] = [];
  const entryTypes = gameData.documentationEntries.map(
    (entry) => entry.entryType
  );

  for (const required of requiredEntries) {
    if (!entryTypes.includes(required as any)) {
      violations.push({
        id: `doc_violation_${Date.now()}`,
        timestamp: new Date(),
        violationType: "missing_documentation",
        description: `Missing required documentation: ${required}`,
        severity: "moderate",
        pointsPenalty: 15,
      });
    }
  }

  return violations;
}

/**
 * Calculate excavation progress based on tool and conditions
 */
function calculateExcavationProgress(
  tool: ExcavationTool,
  conditions: EnvironmentalConditions
): number {
  let baseProgress = tool.effectiveness * 0.1; // Base 10% progress per action

  // Adjust for environmental conditions
  const visibilityFactor = conditions.visibility / 100;
  const currentFactor = Math.max(0.3, 1 - conditions.currentStrength / 10);

  baseProgress *= visibilityFactor * currentFactor;

  // Tool-specific adjustments
  if (tool.type === "trowel") {
    baseProgress *= 1.2; // Trowels are more effective for excavation
  } else if (tool.type === "brush") {
    baseProgress *= 0.8; // Brushes are slower but more careful
  }

  return Math.max(0.01, baseProgress); // Minimum progress to avoid getting stuck
}

/**
 * Calculate score for artifact discovery
 */
function calculateDiscoveryScore(
  artifact: SiteArtifact,
  tool: ExcavationTool,
  conditions: EnvironmentalConditions
): number {
  let baseScore = 100;

  // Bonus for using appropriate tools
  const toolValidation = validateToolUsage(
    tool,
    "discovery",
    conditions,
    artifact.condition
  );
  if (toolValidation.isValid) {
    baseScore += 25;
  }

  // Bonus based on artifact condition preservation
  const conditionBonus = {
    excellent: 50,
    good: 30,
    fair: 15,
    poor: 5,
  };
  baseScore += conditionBonus[artifact.condition];

  // Bonus for difficult conditions
  if (conditions.visibility < 50) baseScore += 20;
  if (conditions.currentStrength > 5) baseScore += 15;
  if (conditions.depth > 20) baseScore += 10;

  return baseScore;
}

/**
 * Generate site report based on excavation results
 */
export function generateSiteReport(
  gameData: ExcavationGameData,
  siteName: string,
  siteArtifacts: SiteArtifact[]
): {
  completionPercentage: number;
  artifactsFound: number;
  totalArtifacts: number;
  documentationQuality: number;
  protocolCompliance: number;
  overallScore: number;
  recommendations: string[];
} {
  const totalCells = gameData.excavatedCells.length;
  const excavatedCells = gameData.excavatedCells.filter(
    (cell) => cell.excavated
  ).length;
  const completionPercentage = (excavatedCells / totalCells) * 100;

  const artifactsFound = gameData.discoveredArtifacts.length;
  const totalArtifacts = siteArtifacts.length;

  // Calculate documentation quality (0-100)
  const requiredDocTypes = ["discovery", "measurement", "photo"];
  const providedDocTypes = [
    ...new Set(gameData.documentationEntries.map((e) => e.entryType)),
  ];
  const documentationQuality =
    (providedDocTypes.length / requiredDocTypes.length) * 100;

  // Calculate protocol compliance (0-100)
  const totalViolations = gameData.protocolViolations.length;
  const severePenalty =
    gameData.protocolViolations.filter((v) => v.severity === "severe").length *
    30;
  const moderatePenalty =
    gameData.protocolViolations.filter((v) => v.severity === "moderate")
      .length * 15;
  const minorPenalty =
    gameData.protocolViolations.filter((v) => v.severity === "minor").length *
    5;
  const protocolCompliance = Math.max(
    0,
    100 - severePenalty - moderatePenalty - minorPenalty
  );

  // Calculate overall score
  const overallScore = Math.round(
    completionPercentage * 0.3 +
      (artifactsFound / totalArtifacts) * 100 * 0.4 +
      documentationQuality * 0.2 +
      protocolCompliance * 0.1
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (completionPercentage < 70) {
    recommendations.push(
      "Consider more systematic excavation to improve site coverage"
    );
  }
  if (documentationQuality < 80) {
    recommendations.push(
      "Improve documentation by taking more photos and measurements"
    );
  }
  if (protocolCompliance < 90) {
    recommendations.push("Review archaeological protocols to avoid violations");
  }
  if (artifactsFound < totalArtifacts) {
    recommendations.push(
      "Use probes and careful excavation to locate remaining artifacts"
    );
  }

  return {
    completionPercentage: Math.round(completionPercentage),
    artifactsFound,
    totalArtifacts,
    documentationQuality: Math.round(documentationQuality),
    protocolCompliance: Math.round(protocolCompliance),
    overallScore,
    recommendations,
  };
}
