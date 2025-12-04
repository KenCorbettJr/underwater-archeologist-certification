import {
  ExcavationGameData,
  ExcavationTool,
  DocumentationEntry,
  ProtocolViolation,
  EnvironmentalConditions,
  SiteArtifact,
} from "../types";

/**
 * Archaeological excavation protocols and validation system
 */

export interface ProtocolRule {
  id: string;
  name: string;
  description: string;
  category: "safety" | "documentation" | "technique" | "preservation";
  severity: "minor" | "moderate" | "severe";
  checkFunction: (context: ProtocolContext) => ProtocolViolation | null;
}

export interface ProtocolContext {
  gameData: ExcavationGameData;
  currentAction: {
    type: string;
    gridX: number;
    gridY: number;
    tool: ExcavationTool;
  };
  environmentalConditions: EnvironmentalConditions;
  siteArtifacts: SiteArtifact[];
  timeElapsed: number;
}

/**
 * Standard archaeological excavation protocols
 */
export const EXCAVATION_PROTOCOLS: ProtocolRule[] = [
  {
    id: "proper_tool_selection",
    name: "Proper Tool Selection",
    description: "Use appropriate tools for specific tasks and conditions",
    category: "technique",
    severity: "moderate",
    checkFunction: (context) => {
      const { currentAction, environmentalConditions } = context;
      const { tool, gridX, gridY } = currentAction;

      // Check if tool is appropriate for current conditions
      if (environmentalConditions.visibility < 30 && tool.type === "camera") {
        return {
          id: `violation_${Date.now()}`,
          timestamp: new Date(),
          violationType: "improper_tool",
          description:
            "Camera use in low visibility conditions may result in poor documentation",
          severity: "moderate",
          pointsPenalty: 15,
        };
      }

      if (
        environmentalConditions.currentStrength > 6 &&
        tool.type === "brush"
      ) {
        return {
          id: `violation_${Date.now()}`,
          timestamp: new Date(),
          violationType: "improper_tool",
          description: "Brush work in strong currents may damage artifacts",
          severity: "moderate",
          pointsPenalty: 20,
        };
      }

      return null;
    },
  },

  {
    id: "artifact_documentation_before_removal",
    name: "Document Before Removal",
    description: "All artifacts must be documented in situ before removal",
    category: "documentation",
    severity: "severe",
    checkFunction: (context) => {
      const { gameData, currentAction } = context;
      const { gridX, gridY } = currentAction;

      // Check if there's an artifact at this position
      const cell = gameData.excavatedCells.find(
        (c) => c.x === gridX && c.y === gridY
      );
      if (!cell?.containsArtifact) return null;

      // Check if artifact has been documented
      const artifactDocs = gameData.documentationEntries.filter(
        (entry) =>
          entry.gridPosition.x === gridX &&
          entry.gridPosition.y === gridY &&
          (entry.entryType === "discovery" ||
            entry.entryType === "photo" ||
            entry.entryType === "measurement")
      );

      if (artifactDocs.length < 2) {
        // Require at least discovery + one other type
        return {
          id: `violation_${Date.now()}`,
          timestamp: new Date(),
          violationType: "missing_documentation",
          description:
            "Artifact must be photographed and measured before removal",
          severity: "severe",
          pointsPenalty: 30,
        };
      }

      return null;
    },
  },

  {
    id: "systematic_excavation",
    name: "Systematic Excavation",
    description: "Excavate in a systematic pattern to maintain site integrity",
    category: "technique",
    severity: "minor",
    checkFunction: (context) => {
      const { gameData, currentAction } = context;
      const { gridX, gridY } = currentAction;

      // Check if excavation is too scattered (jumping around randomly)
      const recentActions = gameData.excavatedCells
        .filter((cell) => cell.excavated)
        .slice(-5); // Last 5 excavated cells

      if (recentActions.length >= 3) {
        const distances = [];
        for (let i = 1; i < recentActions.length; i++) {
          const prev = recentActions[i - 1];
          const curr = recentActions[i];
          const distance = Math.sqrt(
            Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
          );
          distances.push(distance);
        }

        const avgDistance =
          distances.reduce((a, b) => a + b, 0) / distances.length;
        if (avgDistance > 3) {
          // Average jump distance > 3 cells
          return {
            id: `violation_${Date.now()}`,
            timestamp: new Date(),
            violationType: "rushed_excavation",
            description:
              "Excavation pattern is too scattered - work more systematically",
            severity: "minor",
            pointsPenalty: 5,
          };
        }
      }

      return null;
    },
  },

  {
    id: "time_management",
    name: "Proper Time Management",
    description: "Manage time effectively to complete thorough excavation",
    category: "technique",
    severity: "minor",
    checkFunction: (context) => {
      const { gameData, timeElapsed } = context;
      const totalTime = 45 * 60; // Assume 45 minutes total
      const timeProgress = timeElapsed / totalTime;

      const totalCells = gameData.excavatedCells.length;
      const excavatedCells = gameData.excavatedCells.filter(
        (c) => c.excavated
      ).length;
      const excavationProgress = excavatedCells / totalCells;

      // If more than 80% time used but less than 50% excavated
      if (timeProgress > 0.8 && excavationProgress < 0.5) {
        return {
          id: `violation_${Date.now()}`,
          timestamp: new Date(),
          violationType: "rushed_excavation",
          description:
            "Running out of time - consider more efficient excavation methods",
          severity: "minor",
          pointsPenalty: 10,
        };
      }

      return null;
    },
  },

  {
    id: "environmental_awareness",
    name: "Environmental Condition Awareness",
    description: "Adapt techniques based on environmental conditions",
    category: "safety",
    severity: "moderate",
    checkFunction: (context) => {
      const { currentAction, environmentalConditions } = context;
      const { tool } = currentAction;

      // Check for dangerous conditions
      if (
        environmentalConditions.currentStrength > 8 &&
        tool.type !== "probe"
      ) {
        return {
          id: `violation_${Date.now()}`,
          timestamp: new Date(),
          violationType: "improper_tool",
          description: "Dangerous current conditions - use probe for safety",
          severity: "moderate",
          pointsPenalty: 25,
        };
      }

      if (environmentalConditions.depth > 30 && tool.type === "sieve") {
        return {
          id: `violation_${Date.now()}`,
          timestamp: new Date(),
          violationType: "improper_tool",
          description: "Sieve work at extreme depth may be ineffective",
          severity: "minor",
          pointsPenalty: 10,
        };
      }

      return null;
    },
  },

  {
    id: "artifact_preservation",
    name: "Artifact Preservation",
    description: "Use gentle techniques to preserve artifact integrity",
    category: "preservation",
    severity: "severe",
    checkFunction: (context) => {
      const { currentAction, siteArtifacts } = context;
      const { tool, gridX, gridY } = currentAction;

      // Find artifact at current position
      const artifact = siteArtifacts.find(
        (a) => a.gridPosition.x === gridX && a.gridPosition.y === gridY
      );

      if (artifact) {
        // Check if using inappropriate tool for artifact condition
        if (artifact.condition === "poor" && tool.id === "hard_brush") {
          return {
            id: `violation_${Date.now()}`,
            timestamp: new Date(),
            violationType: "damage",
            description:
              "Hard brush may damage fragile artifact - use soft brush or trowel",
            severity: "severe",
            pointsPenalty: 40,
          };
        }

        if (artifact.condition === "poor" && tool.type === "sieve") {
          return {
            id: `violation_${Date.now()}`,
            timestamp: new Date(),
            violationType: "damage",
            description:
              "Sieve may break fragile artifact - use gentle hand excavation",
            severity: "severe",
            pointsPenalty: 35,
          };
        }
      }

      return null;
    },
  },

  {
    id: "complete_documentation",
    name: "Complete Documentation",
    description: "Maintain comprehensive records of all excavation activities",
    category: "documentation",
    severity: "moderate",
    checkFunction: (context) => {
      const { gameData, timeElapsed } = context;
      const totalTime = 45 * 60; // 45 minutes
      const timeProgress = timeElapsed / totalTime;

      // Check documentation frequency - should have docs every 10 minutes
      const expectedDocs = Math.floor(timeProgress * 4); // 4 docs in 45 minutes
      const actualDocs = gameData.documentationEntries.length;

      if (timeProgress > 0.25 && actualDocs < expectedDocs) {
        return {
          id: `violation_${Date.now()}`,
          timestamp: new Date(),
          violationType: "missing_documentation",
          description:
            "Insufficient documentation frequency - record more observations",
          severity: "moderate",
          pointsPenalty: 15,
        };
      }

      return null;
    },
  },
];

/**
 * Validate current action against all protocols
 */
export function validateExcavationProtocols(
  context: ProtocolContext
): ProtocolViolation[] {
  const violations: ProtocolViolation[] = [];

  for (const protocol of EXCAVATION_PROTOCOLS) {
    try {
      const violation = protocol.checkFunction(context);
      if (violation) {
        violations.push(violation);
      }
    } catch (error) {
      console.error(`Error checking protocol ${protocol.id}:`, error);
    }
  }

  return violations;
}

/**
 * Get protocol guidance based on current game state
 */
export function getProtocolGuidance(
  gameData: ExcavationGameData,
  environmentalConditions: EnvironmentalConditions
): string[] {
  const guidance: string[] = [];

  // Environmental guidance
  if (environmentalConditions.visibility < 50) {
    guidance.push("👁️ Low visibility - use probe to locate artifacts safely");
  }

  if (environmentalConditions.currentStrength > 6) {
    guidance.push(
      "🌊 Strong current - use stable tools and secure positioning"
    );
  }

  // Documentation guidance
  const requiredDocs = gameData.documentationEntries.filter(
    (e) => e.isRequired
  );
  const completedDocs = requiredDocs.filter((e) => e.isComplete);
  if (completedDocs.length < requiredDocs.length) {
    guidance.push("📋 Complete required documentation entries");
  }

  // Excavation progress guidance
  const totalCells = gameData.excavatedCells.length;
  const excavatedCells = gameData.excavatedCells.filter(
    (c) => c.excavated
  ).length;
  const progress = excavatedCells / totalCells;

  if (progress < 0.3) {
    guidance.push("🏗️ Increase excavation pace to cover more area");
  }

  // Artifact discovery guidance
  if (gameData.discoveredArtifacts.length === 0 && progress > 0.4) {
    guidance.push(
      "🔍 No artifacts found yet - try using probe in different areas"
    );
  }

  return guidance;
}

/**
 * Calculate protocol compliance score
 */
export function calculateProtocolCompliance(gameData: ExcavationGameData): {
  score: number;
  breakdown: Record<string, number>;
  recommendations: string[];
} {
  const violations = gameData.protocolViolations;
  const severePenalty =
    violations.filter((v) => v.severity === "severe").length * 30;
  const moderatePenalty =
    violations.filter((v) => v.severity === "moderate").length * 15;
  const minorPenalty =
    violations.filter((v) => v.severity === "minor").length * 5;

  const totalPenalty = severePenalty + moderatePenalty + minorPenalty;
  const score = Math.max(0, 100 - totalPenalty);

  const breakdown = {
    severe: violations.filter((v) => v.severity === "severe").length,
    moderate: violations.filter((v) => v.severity === "moderate").length,
    minor: violations.filter((v) => v.severity === "minor").length,
  };

  const recommendations: string[] = [];

  if (breakdown.severe > 0) {
    recommendations.push("Review artifact preservation techniques");
    recommendations.push("Ensure proper documentation before artifact removal");
  }

  if (breakdown.moderate > 2) {
    recommendations.push("Improve tool selection for current conditions");
    recommendations.push("Maintain more systematic excavation patterns");
  }

  if (breakdown.minor > 3) {
    recommendations.push("Work on time management and efficiency");
    recommendations.push("Increase documentation frequency");
  }

  return { score, breakdown, recommendations };
}
