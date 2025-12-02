import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Conservation lab game data structure
interface ConservationGameData {
  artifactId: Id<"gameArtifacts">;
  condition: ArtifactCondition;
  assessmentComplete: boolean;
  selectedProcesses: ConservationProcess[];
  treatmentPlan: TreatmentStep[];
  completedSteps: string[];
  score: number;
  mistakes: ConservationMistake[];
}

interface ArtifactCondition {
  overallCondition: "excellent" | "good" | "fair" | "poor";
  damages: Damage[];
  environmentalFactors: string[];
  materialType: string;
  ageEstimate: string;
}

interface Damage {
  id: string;
  type:
    | "corrosion"
    | "fracture"
    | "encrustation"
    | "biological"
    | "deterioration";
  severity: "minor" | "moderate" | "severe";
  location: string;
  description: string;
}

interface ConservationProcess {
  id: string;
  name: string;
  category: "cleaning" | "stabilization" | "repair" | "preservation";
  description: string;
  duration: number; // in hours
  isAppropriate: boolean;
}

interface TreatmentStep {
  id: string;
  stepNumber: number;
  processId: string;
  description: string;
  estimatedTime: number;
  isComplete: boolean;
  isCorrect: boolean;
}

interface ConservationMistake {
  id: string;
  stepId: string;
  description: string;
  consequence: string;
  pointsPenalty: number;
}

// Start a new conservation lab game
export const startConservationLabGame = mutation({
  args: {
    userId: v.id("users"),
    artifactId: v.id("gameArtifacts"),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  returns: v.id("gameSessions"),
  handler: async (ctx, args) => {
    const artifact = await ctx.db.get(args.artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    // Generate artifact condition based on difficulty
    const condition = generateArtifactCondition(args.difficulty);

    const gameData: ConservationGameData = {
      artifactId: args.artifactId,
      condition,
      assessmentComplete: false,
      selectedProcesses: [],
      treatmentPlan: [],
      completedSteps: [],
      score: 0,
      mistakes: [],
    };

    const sessionId = await ctx.db.insert("gameSessions", {
      userId: args.userId,
      gameType: "conservation_lab",
      difficulty: args.difficulty,
      status: "active",
      startTime: Date.now(),
      currentScore: 0,
      maxScore: 1000,
      completionPercentage: 0,
      gameData: JSON.stringify(gameData),
      actions: [],
    });

    return sessionId;
  },
});

// Complete condition assessment
export const completeAssessment = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    identifiedDamages: v.array(v.string()),
  },
  returns: v.object({
    score: v.number(),
    accuracy: v.number(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    // Check accuracy of damage identification
    const actualDamages = gameData.condition.damages.map((d) => d.id);
    const correctIdentifications = args.identifiedDamages.filter((id) =>
      actualDamages.includes(id)
    );

    const accuracy = correctIdentifications.length / actualDamages.length;
    const assessmentScore = Math.round(accuracy * 200);

    gameData.assessmentComplete = true;
    gameData.score += assessmentScore;

    await ctx.db.patch(args.sessionId, {
      currentScore: session.currentScore + assessmentScore,
      completionPercentage: 25,
      gameData: JSON.stringify(gameData),
    });

    return {
      score: assessmentScore,
      accuracy: Math.round(accuracy * 100),
      feedback:
        accuracy >= 0.8
          ? "Excellent assessment!"
          : accuracy >= 0.6
            ? "Good assessment, but some damages were missed."
            : "Assessment needs improvement. Review the artifact more carefully.",
    };
  },
});

// Select conservation process
export const selectProcess = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    processId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    isAppropriate: v.boolean(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    if (!gameData.assessmentComplete) {
      throw new Error("Complete assessment first");
    }

    // Get available processes
    const availableProcesses = getAvailableProcesses(gameData.condition);
    const process = availableProcesses.find((p) => p.id === args.processId);

    if (!process) {
      throw new Error("Invalid process");
    }

    // Check if already selected
    if (gameData.selectedProcesses.some((p) => p.id === args.processId)) {
      return {
        success: false,
        isAppropriate: false,
        feedback: "Process already selected",
      };
    }

    gameData.selectedProcesses.push(process);

    if (!process.isAppropriate) {
      gameData.mistakes.push({
        id: `mistake_${Date.now()}`,
        stepId: args.processId,
        description: `${process.name} is not appropriate for this artifact`,
        consequence: "May cause damage or be ineffective",
        pointsPenalty: 50,
      });
      gameData.score -= 50;
    }

    await ctx.db.patch(args.sessionId, {
      currentScore: Math.max(
        0,
        session.currentScore + (process.isAppropriate ? 0 : -50)
      ),
      gameData: JSON.stringify(gameData),
    });

    return {
      success: true,
      isAppropriate: process.isAppropriate,
      feedback: process.isAppropriate
        ? "Good choice! This process is appropriate."
        : "Warning: This process may not be suitable for this artifact.",
    };
  },
});

// Create treatment plan
export const createTreatmentPlan = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    processOrder: v.array(v.string()),
  },
  returns: v.object({
    score: v.number(),
    isCorrectOrder: v.boolean(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    // Validate process order (cleaning -> stabilization -> repair -> preservation)
    const correctOrder = validateProcessOrder(
      args.processOrder,
      gameData.selectedProcesses
    );
    const planScore = correctOrder ? 300 : 100;

    // Create treatment steps
    gameData.treatmentPlan = args.processOrder.map((processId, index) => {
      const process = gameData.selectedProcesses.find(
        (p) => p.id === processId
      );
      return {
        id: `step_${index}`,
        stepNumber: index + 1,
        processId,
        description: process?.description || "",
        estimatedTime: process?.duration || 0,
        isComplete: false,
        isCorrect: correctOrder,
      };
    });

    gameData.score += planScore;

    await ctx.db.patch(args.sessionId, {
      currentScore: session.currentScore + planScore,
      completionPercentage: 50,
      gameData: JSON.stringify(gameData),
    });

    return {
      score: planScore,
      isCorrectOrder: correctOrder,
      feedback: correctOrder
        ? "Excellent treatment plan! Processes are in the correct order."
        : "Treatment plan created, but the order could be improved.",
    };
  },
});

// Execute treatment step
export const executeTreatmentStep = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    stepId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    score: v.number(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    const step = gameData.treatmentPlan.find((s) => s.id === args.stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    if (step.isComplete) {
      return {
        success: false,
        score: 0,
        feedback: "Step already completed",
      };
    }

    step.isComplete = true;
    gameData.completedSteps.push(args.stepId);

    const stepScore = step.isCorrect ? 100 : 50;
    gameData.score += stepScore;

    const completionPercentage = Math.round(
      50 + (gameData.completedSteps.length / gameData.treatmentPlan.length) * 50
    );

    await ctx.db.patch(args.sessionId, {
      currentScore: session.currentScore + stepScore,
      completionPercentage,
      gameData: JSON.stringify(gameData),
    });

    return {
      success: true,
      score: stepScore,
      feedback: "Treatment step completed successfully!",
    };
  },
});

// Get game state
export const getConservationLabGame = query({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    session: v.object({
      _id: v.id("gameSessions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      gameType: v.union(
        v.literal("artifact_identification"),
        v.literal("excavation_simulation"),
        v.literal("site_documentation"),
        v.literal("historical_timeline"),
        v.literal("conservation_lab")
      ),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      status: v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("abandoned")
      ),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      currentScore: v.number(),
      maxScore: v.number(),
      completionPercentage: v.number(),
      gameData: v.string(),
      actions: v.array(v.string()),
    }),
    artifact: v.object({
      _id: v.id("gameArtifacts"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      historicalPeriod: v.string(),
      culture: v.string(),
      dateRange: v.string(),
      significance: v.string(),
      imageUrl: v.string(),
      imageStorageId: v.optional(v.id("_storage")),
      modelUrl: v.optional(v.string()),
      discoveryLocation: v.string(),
      conservationNotes: v.string(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      category: v.string(),
      isActive: v.boolean(),
    }),
    gameData: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Game session not found");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);
    const artifact = await ctx.db.get(gameData.artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    return {
      session,
      artifact,
      gameData: session.gameData,
    };
  },
});

// Complete conservation game
export const completeConservationLabGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    success: v.boolean(),
    finalScore: v.number(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    const allStepsComplete =
      gameData.treatmentPlan.length > 0 &&
      gameData.completedSteps.length === gameData.treatmentPlan.length;

    if (!allStepsComplete) {
      return {
        success: false,
        finalScore: session.currentScore,
        feedback: "Complete all treatment steps before finishing.",
      };
    }

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endTime: Date.now(),
    });

    return {
      success: true,
      finalScore: session.currentScore,
      feedback: "Conservation treatment completed successfully!",
    };
  },
});

// Helper functions
function generateArtifactCondition(difficulty: string): ArtifactCondition {
  const beginnerDamages: Damage[] = [
    {
      id: "damage_1",
      type: "encrustation",
      severity: "moderate",
      location: "surface",
      description: "Marine growth and calcium deposits covering the surface",
    },
    {
      id: "damage_2",
      type: "corrosion",
      severity: "minor",
      location: "edges",
      description: "Light oxidation on metal components",
    },
  ];

  return {
    overallCondition: "fair",
    damages: beginnerDamages,
    environmentalFactors: [
      "saltwater exposure",
      "marine organisms",
      "sediment burial",
    ],
    materialType: "ceramic with metal fittings",
    ageEstimate: "2000-2500 years",
  };
}

function getAvailableProcesses(
  condition: ArtifactCondition
): ConservationProcess[] {
  return [
    {
      id: "process_1",
      name: "Gentle Cleaning",
      category: "cleaning",
      description: "Remove loose sediment and marine growth with soft brushes",
      duration: 2,
      isAppropriate: true,
    },
    {
      id: "process_2",
      name: "Chemical Bath",
      category: "cleaning",
      description: "Soak in specialized cleaning solution",
      duration: 4,
      isAppropriate: condition.materialType.includes("ceramic"),
    },
    {
      id: "process_3",
      name: "Consolidation",
      category: "stabilization",
      description: "Apply consolidant to strengthen fragile areas",
      duration: 3,
      isAppropriate: true,
    },
    {
      id: "process_4",
      name: "Adhesive Repair",
      category: "repair",
      description: "Rejoin broken fragments with conservation-grade adhesive",
      duration: 2,
      isAppropriate: condition.damages.some((d) => d.type === "fracture"),
    },
    {
      id: "process_5",
      name: "Protective Coating",
      category: "preservation",
      description: "Apply protective coating to prevent future deterioration",
      duration: 1,
      isAppropriate: true,
    },
  ];
}

function validateProcessOrder(
  order: string[],
  processes: ConservationProcess[]
): boolean {
  const categories = order.map((id) => {
    const process = processes.find((p) => p.id === id);
    return process?.category;
  });

  // Correct order: cleaning -> stabilization -> repair -> preservation
  const categoryOrder = ["cleaning", "stabilization", "repair", "preservation"];
  let lastIndex = -1;

  for (const category of categories) {
    const currentIndex = categoryOrder.indexOf(category || "");
    if (currentIndex < lastIndex) {
      return false;
    }
    lastIndex = currentIndex;
  }

  return true;
}
