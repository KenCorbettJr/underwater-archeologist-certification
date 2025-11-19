/**
 * Provides helpful tool suggestions based on violation type and context
 */

export interface ToolSuggestion {
  recommendedTools: string[];
  reason: string;
  tips: string[];
}

export function getToolSuggestion(
  violationType: string,
  currentTool: string,
  context?: {
    artifactCondition?: string;
    visibility?: number;
    currentStrength?: number;
  }
): ToolSuggestion {
  // Hard Brush violations
  if (currentTool === "Hard Brush") {
    if (
      context?.artifactCondition === "poor" ||
      context?.artifactCondition === "fair"
    ) {
      return {
        recommendedTools: ["Soft Brush", "Archaeological Trowel"],
        reason: "The artifact is fragile and needs gentle handling",
        tips: [
          "Use a Soft Brush for delicate cleaning",
          "A Trowel provides precision for careful extraction",
          "Hard brushes can damage fragile artifacts",
        ],
      };
    }
    return {
      recommendedTools: ["Soft Brush", "Archaeological Trowel"],
      reason:
        "Hard brushes are only suitable for heavy sediment on robust artifacts",
      tips: [
        "Start with gentler tools for excavation",
        "Save hard brushes for initial sediment removal",
        "Switch to Soft Brush when artifacts are detected",
      ],
    };
  }

  // Brush in strong current
  if (
    currentTool.includes("Brush") &&
    context?.currentStrength &&
    context.currentStrength > 6
  ) {
    return {
      recommendedTools: ["Archaeological Trowel", "Archaeological Probe"],
      reason: "Current is too strong for brush work",
      tips: [
        "Use a Trowel for more stable excavation",
        "Wait for calmer conditions before using brushes",
        "Probe can help detect artifacts safely",
      ],
    };
  }

  // Camera in low visibility
  if (
    currentTool === "Underwater Camera" &&
    context?.visibility &&
    context.visibility < 30
  ) {
    return {
      recommendedTools: ["Measuring Tape", "Archaeological Probe"],
      reason: "Visibility is too low for quality photography",
      tips: [
        "Improve lighting conditions first",
        "Use Measuring Tape for documentation",
        "Wait for better visibility before photographing",
      ],
    };
  }

  // General excavation suggestions
  if (violationType.includes("excavation")) {
    return {
      recommendedTools: ["Archaeological Trowel", "Soft Brush"],
      reason: "These tools are best for careful excavation work",
      tips: [
        "Trowel: Best for precision excavation",
        "Soft Brush: Ideal for cleaning and revealing artifacts",
        "Always document before removing artifacts",
      ],
    };
  }

  // Documentation suggestions
  if (violationType.includes("documentation")) {
    return {
      recommendedTools: ["Underwater Camera", "Measuring Tape"],
      reason: "Proper documentation requires photos and measurements",
      tips: [
        "Take photos before disturbing the site",
        "Record measurements of all artifacts",
        "Document the excavation process",
      ],
    };
  }

  // Default suggestion
  return {
    recommendedTools: ["Archaeological Trowel", "Soft Brush", "Measuring Tape"],
    reason: "These are the most versatile tools for archaeological work",
    tips: [
      "Choose tools based on the task at hand",
      "Consider artifact condition and environmental factors",
      "Document everything as you work",
    ],
  };
}

export function formatToolViolationMessage(
  toolName: string,
  actionType: string,
  suggestion: ToolSuggestion
): { title: string; message: string; tips: string[] } {
  return {
    title: `${toolName} Not Suitable`,
    message: `${suggestion.reason}. Try using: ${suggestion.recommendedTools.join(" or ")}.`,
    tips: suggestion.tips,
  };
}
