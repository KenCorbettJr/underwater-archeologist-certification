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
  bonusPoints: number;
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
      bonusPoints: 0,
      mistakes: [],
    };

    const sessionId = await ctx.db.insert("gameSessions", {
      userId: args.userId,
      gameType: "conservation_lab",
      difficulty: args.difficulty,
      status: "active",
      startTime: Date.now(),
      currentScore: 0,
      maxScore: 100,
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
    const assessmentScore = Math.round(accuracy * 20); // Out of 20 points

    gameData.assessmentComplete = true;

    // Cap score at 100, overflow goes to bonus
    const newTotal = gameData.score + assessmentScore;
    if (newTotal > 100) {
      gameData.bonusPoints += newTotal - 100;
      gameData.score = 100;
    } else {
      gameData.score = newTotal;
    }

    await ctx.db.patch(args.sessionId, {
      currentScore: Math.min(100, session.currentScore + assessmentScore),
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
        pointsPenalty: 5,
      });
      gameData.score = Math.max(0, gameData.score - 5);
    }

    await ctx.db.patch(args.sessionId, {
      currentScore: Math.max(
        0,
        session.currentScore - (process.isAppropriate ? 0 : 5)
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

// Remove conservation process
export const removeProcess = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    processId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    feedback: v.string(),
    pointsRestored: v.number(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    // Find the process
    const processIndex = gameData.selectedProcesses.findIndex(
      (p) => p.id === args.processId
    );

    if (processIndex === -1) {
      return {
        success: false,
        feedback: "Process not found",
        pointsRestored: 0,
      };
    }

    const process = gameData.selectedProcesses[processIndex];
    let pointsRestored = 0;

    // If it was an inappropriate process, restore the penalty points
    if (!process.isAppropriate) {
      const mistakeIndex = gameData.mistakes.findIndex(
        (m) => m.stepId === args.processId
      );
      if (mistakeIndex !== -1) {
        pointsRestored = gameData.mistakes[mistakeIndex].pointsPenalty;
        gameData.mistakes.splice(mistakeIndex, 1);
        gameData.score += pointsRestored;
      }
    }

    // Remove the process
    gameData.selectedProcesses.splice(processIndex, 1);

    await ctx.db.patch(args.sessionId, {
      currentScore: Math.min(100, session.currentScore + pointsRestored),
      gameData: JSON.stringify(gameData),
    });

    return {
      success: true,
      feedback:
        pointsRestored > 0
          ? `Process removed. ${pointsRestored} points restored.`
          : "Process removed.",
      pointsRestored,
    };
  },
});

// Validate process selection
export const validateProcessSelection = mutation({
  args: {
    sessionId: v.id("gameSessions"),
  },
  returns: v.object({
    success: v.boolean(),
    pointsEarned: v.number(),
    appropriateCount: v.number(),
    inappropriateCount: v.number(),
    feedback: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    if (gameData.selectedProcesses.length === 0) {
      return {
        success: false,
        pointsEarned: 0,
        appropriateCount: 0,
        inappropriateCount: 0,
        feedback: "Please select at least one conservation process.",
      };
    }

    const appropriateProcesses = gameData.selectedProcesses.filter(
      (p) => p.isAppropriate
    );
    const inappropriateProcesses = gameData.selectedProcesses.filter(
      (p) => !p.isAppropriate
    );

    // Award points for appropriate selections (10 points each, max 40 for 4 processes)
    const pointsEarned = appropriateProcesses.length * 10;

    if (
      inappropriateProcesses.length === 0 &&
      appropriateProcesses.length > 0
    ) {
      // Cap score at 100, overflow goes to bonus
      const newTotal = gameData.score + pointsEarned;
      if (newTotal > 100) {
        gameData.bonusPoints += newTotal - 100;
        gameData.score = 100;
      } else {
        gameData.score = newTotal;
      }

      await ctx.db.patch(args.sessionId, {
        currentScore: Math.min(100, session.currentScore + pointsEarned),
        gameData: JSON.stringify(gameData),
      });

      return {
        success: true,
        pointsEarned,
        appropriateCount: appropriateProcesses.length,
        inappropriateCount: 0,
        feedback: `Excellent! All ${appropriateProcesses.length} selected process(es) are appropriate. You earned ${pointsEarned} points!`,
      };
    } else {
      return {
        success: false,
        pointsEarned: 0,
        appropriateCount: appropriateProcesses.length,
        inappropriateCount: inappropriateProcesses.length,
        feedback: `You have ${inappropriateProcesses.length} inappropriate process(es) selected. Remove them before proceeding.`,
      };
    }
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
    orderingErrors: v.array(
      v.object({
        processName: v.string(),
        issue: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Invalid or inactive game session");
    }

    const gameData: ConservationGameData = JSON.parse(session.gameData);

    // Validate process order (cleaning -> stabilization -> repair -> preservation)
    const orderValidation = validateProcessOrderDetailed(
      args.processOrder,
      gameData.selectedProcesses
    );
    const correctOrder = orderValidation.isCorrect;
    const planScore = correctOrder ? 30 : 10; // Out of 30 points

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

    // Cap score at 100, overflow goes to bonus
    const newTotal = gameData.score + planScore;
    if (newTotal > 100) {
      gameData.bonusPoints += newTotal - 100;
      gameData.score = 100;
    } else {
      gameData.score = newTotal;
    }

    await ctx.db.patch(args.sessionId, {
      currentScore: Math.min(100, session.currentScore + planScore),
      completionPercentage: 50,
      gameData: JSON.stringify(gameData),
    });

    let feedback = "";
    if (correctOrder) {
      feedback =
        "Excellent treatment plan! Processes are in the correct order: Cleaning → Stabilization → Repair → Preservation.";
    } else {
      feedback = `Treatment plan created, but the order has issues. You earned ${planScore} points instead of 30. ${orderValidation.errors.length > 0 ? "See the errors below for details." : ""}`;
    }

    return {
      score: planScore,
      isCorrectOrder: correctOrder,
      feedback,
      orderingErrors: orderValidation.errors,
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

    const stepScore = step.isCorrect ? 10 : 5; // Out of 10 points per step

    // Cap score at 100, overflow goes to bonus
    const newTotal = gameData.score + stepScore;
    if (newTotal > 100) {
      gameData.bonusPoints += newTotal - 100;
      gameData.score = 100;
    } else {
      gameData.score = newTotal;
    }

    const completionPercentage = Math.round(
      50 + (gameData.completedSteps.length / gameData.treatmentPlan.length) * 50
    );

    await ctx.db.patch(args.sessionId, {
      currentScore: Math.min(100, session.currentScore + stepScore),
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

    if (!session) {
      throw new Error("Game session not found. Please start a new game.");
    }

    if (session.status !== "active") {
      throw new Error(
        `Game session is ${session.status}. Cannot complete an inactive session.`
      );
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
  // Define possible material types
  const materialTypes = [
    "ceramic with metal fittings",
    "bronze with decorative elements",
    "iron with wooden handle remnants",
    "stone with carved details",
    "glass with metal frame",
    "composite ceramic and stone",
    "copper alloy with inlay",
    "terracotta with painted surface",
  ];

  // Define possible damage types with descriptions
  const damagePool = [
    {
      type: "encrustation" as const,
      locations: ["surface", "crevices", "decorative elements", "base"],
      descriptions: [
        "Marine growth and calcium deposits covering the surface",
        "Thick layers of barnacles and shell fragments",
        "Coral encrustation obscuring original features",
        "Mineral deposits from sediment burial",
      ],
    },
    {
      type: "corrosion" as const,
      locations: ["edges", "joints", "metal components", "fasteners"],
      descriptions: [
        "Light oxidation on metal components",
        "Active corrosion with green patina formation",
        "Severe rust compromising structural integrity",
        "Galvanic corrosion at metal junctions",
      ],
    },
    {
      type: "fracture" as const,
      locations: ["body", "rim", "handle", "base"],
      descriptions: [
        "Clean break through the main body",
        "Multiple stress fractures radiating from impact point",
        "Hairline cracks throughout the structure",
        "Complete separation of major components",
      ],
    },
    {
      type: "biological" as const,
      locations: ["interior", "porous areas", "organic materials", "surface"],
      descriptions: [
        "Fungal growth in porous areas",
        "Bacterial degradation of organic components",
        "Algae staining on exposed surfaces",
        "Insect damage to wooden elements",
      ],
    },
    {
      type: "deterioration" as const,
      locations: ["surface", "edges", "thin sections", "decorative details"],
      descriptions: [
        "Surface flaking and material loss",
        "Powdering and friability of the material",
        "Delamination of surface layers",
        "Erosion from water movement",
      ],
    },
  ];

  // Define environmental factors
  const environmentalFactorPool = [
    "saltwater exposure",
    "marine organisms",
    "sediment burial",
    "tidal action",
    "anaerobic conditions",
    "shifting currents",
    "temperature fluctuations",
    "pressure from overlying sediment",
    "chemical reactions with seawater",
    "biological activity",
  ];

  // Define age estimates
  const ageEstimates = [
    "500-1000 years",
    "1000-1500 years",
    "1500-2000 years",
    "2000-2500 years",
    "2500-3000 years",
    "3000-4000 years",
  ];

  // Generate damages based on difficulty
  const damages: Damage[] = [];
  let numDamages: number;
  let severityWeights: { minor: number; moderate: number; severe: number };

  if (difficulty === "beginner") {
    numDamages = 2 + Math.floor(Math.random() * 2); // 2-3 damages
    severityWeights = { minor: 0.5, moderate: 0.4, severe: 0.1 };
  } else if (difficulty === "intermediate") {
    numDamages = 3 + Math.floor(Math.random() * 2); // 3-4 damages
    severityWeights = { minor: 0.3, moderate: 0.5, severe: 0.2 };
  } else {
    // advanced
    numDamages = 4 + Math.floor(Math.random() * 2); // 4-5 damages
    severityWeights = { minor: 0.2, moderate: 0.4, severe: 0.4 };
  }

  // Randomly select damage types (no duplicates)
  const shuffledDamagePool = [...damagePool].sort(() => Math.random() - 0.5);
  const selectedDamageTypes = shuffledDamagePool.slice(0, numDamages);

  selectedDamageTypes.forEach((damageType, index) => {
    const rand = Math.random();
    let severity: "minor" | "moderate" | "severe";

    if (rand < severityWeights.minor) {
      severity = "minor";
    } else if (rand < severityWeights.minor + severityWeights.moderate) {
      severity = "moderate";
    } else {
      severity = "severe";
    }

    const location =
      damageType.locations[
        Math.floor(Math.random() * damageType.locations.length)
      ];
    const description =
      damageType.descriptions[
        Math.floor(Math.random() * damageType.descriptions.length)
      ];

    damages.push({
      id: `damage_${index + 1}`,
      type: damageType.type,
      severity,
      location,
      description,
    });
  });

  // Randomly select environmental factors
  const numFactors = 3 + Math.floor(Math.random() * 3); // 3-5 factors
  const shuffledFactors = [...environmentalFactorPool].sort(
    () => Math.random() - 0.5
  );
  const environmentalFactors = shuffledFactors.slice(0, numFactors);

  // Randomly select material type and age
  const materialType =
    materialTypes[Math.floor(Math.random() * materialTypes.length)];
  const ageEstimate =
    ageEstimates[Math.floor(Math.random() * ageEstimates.length)];

  // Determine overall condition based on severity distribution
  let overallCondition: "excellent" | "good" | "fair" | "poor";
  const severeCount = damages.filter((d) => d.severity === "severe").length;
  const moderateCount = damages.filter((d) => d.severity === "moderate").length;

  if (severeCount >= 2) {
    overallCondition = "poor";
  } else if (severeCount === 1 || moderateCount >= 3) {
    overallCondition = "fair";
  } else if (moderateCount >= 1) {
    overallCondition = "good";
  } else {
    overallCondition = "excellent";
  }

  return {
    overallCondition,
    damages,
    environmentalFactors,
    materialType,
    ageEstimate,
  };
}

function getAvailableProcesses(
  condition: ArtifactCondition
): ConservationProcess[] {
  const hasFractures = condition.damages.some((d) => d.type === "fracture");
  const hasCorrosion = condition.damages.some((d) => d.type === "corrosion");
  const hasEncrustation = condition.damages.some(
    (d) => d.type === "encrustation"
  );
  const hasBiological = condition.damages.some((d) => d.type === "biological");
  const hasDeterioration = condition.damages.some(
    (d) => d.type === "deterioration"
  );

  const isCeramic =
    condition.materialType.includes("ceramic") ||
    condition.materialType.includes("terracotta");
  const isMetal =
    condition.materialType.includes("metal") ||
    condition.materialType.includes("bronze") ||
    condition.materialType.includes("iron") ||
    condition.materialType.includes("copper");
  const isStone = condition.materialType.includes("stone");
  const hasOrganic = condition.materialType.includes("wooden");

  const processes: ConservationProcess[] = [];

  // CLEANING PROCESSES
  processes.push({
    id: "process_gentle_cleaning",
    name: "Gentle Cleaning",
    category: "cleaning",
    description: "Remove loose sediment and marine growth with soft brushes",
    duration: 2,
    isAppropriate: true, // Always appropriate as first step
  });

  processes.push({
    id: "process_chemical_bath",
    name: "Chemical Bath",
    category: "cleaning",
    description: "Soak in specialized cleaning solution",
    duration: 4,
    isAppropriate: isCeramic || isStone,
  });

  processes.push({
    id: "process_mechanical_cleaning",
    name: "Mechanical Cleaning",
    category: "cleaning",
    description: "Use precision tools to remove stubborn encrustations",
    duration: 3,
    isAppropriate: hasEncrustation && (isMetal || isStone),
  });

  processes.push({
    id: "process_ultrasonic_cleaning",
    name: "Ultrasonic Cleaning",
    category: "cleaning",
    description: "Use ultrasonic waves to remove deposits",
    duration: 2,
    isAppropriate: isMetal && !hasFractures,
  });

  processes.push({
    id: "process_biocide_treatment",
    name: "Biocide Treatment",
    category: "cleaning",
    description: "Apply biocide to eliminate biological growth",
    duration: 3,
    isAppropriate: hasBiological,
  });

  // DISTRACTOR CLEANING PROCESSES (inappropriate methods)
  processes.push({
    id: "process_power_washing",
    name: "Power Washing",
    category: "cleaning",
    description: "Use high-pressure water to quickly remove debris",
    duration: 1,
    isAppropriate: false, // Too aggressive - can damage artifacts
  });

  processes.push({
    id: "process_wire_brush",
    name: "Wire Brush Scrubbing",
    category: "cleaning",
    description: "Scrub surface with metal wire brush for thorough cleaning",
    duration: 1,
    isAppropriate: false, // Too abrasive - can scratch and damage surface
  });

  processes.push({
    id: "process_bleach_soak",
    name: "Household Bleach Soak",
    category: "cleaning",
    description: "Soak in bleach solution to remove stains and discoloration",
    duration: 2,
    isAppropriate: false, // Harsh chemicals can damage artifacts
  });

  processes.push({
    id: "process_dishwasher",
    name: "Dishwasher Cleaning",
    category: "cleaning",
    description: "Run through dishwasher cycle for efficient cleaning",
    duration: 1,
    isAppropriate: false, // Heat and detergents can cause irreversible damage
  });

  processes.push({
    id: "process_sandblasting",
    name: "Sandblasting",
    category: "cleaning",
    description: "Use abrasive particles to blast away encrustation",
    duration: 2,
    isAppropriate: false, // Extremely destructive to artifact surfaces
  });

  // STABILIZATION PROCESSES
  processes.push({
    id: "process_consolidation",
    name: "Consolidation",
    category: "stabilization",
    description: "Apply consolidant to strengthen fragile areas",
    duration: 3,
    isAppropriate: hasDeterioration || condition.overallCondition === "poor",
  });

  processes.push({
    id: "process_desalination",
    name: "Desalination",
    category: "stabilization",
    description: "Remove harmful salts through controlled soaking",
    duration: 5,
    isAppropriate: isCeramic || hasOrganic,
  });

  processes.push({
    id: "process_corrosion_inhibitor",
    name: "Corrosion Inhibitor",
    category: "stabilization",
    description: "Apply corrosion inhibitor to metal surfaces",
    duration: 2,
    isAppropriate: hasCorrosion && isMetal,
  });

  processes.push({
    id: "process_freeze_drying",
    name: "Freeze Drying",
    category: "stabilization",
    description: "Remove water through freeze-drying process",
    duration: 8,
    isAppropriate: hasOrganic,
  });

  // REPAIR PROCESSES
  processes.push({
    id: "process_adhesive_repair",
    name: "Adhesive Repair",
    category: "repair",
    description: "Rejoin broken fragments with conservation-grade adhesive",
    duration: 2,
    isAppropriate: hasFractures,
  });

  processes.push({
    id: "process_gap_filling",
    name: "Gap Filling",
    category: "repair",
    description: "Fill losses with reversible conservation materials",
    duration: 3,
    isAppropriate: hasFractures || hasDeterioration,
  });

  processes.push({
    id: "process_structural_support",
    name: "Structural Support",
    category: "repair",
    description: "Add internal support to weak areas",
    duration: 4,
    isAppropriate:
      hasFractures && condition.damages.some((d) => d.severity === "severe"),
  });

  // DISTRACTOR REPAIR PROCESSES (inappropriate methods)
  processes.push({
    id: "process_super_glue",
    name: "Super Glue Repair",
    category: "repair",
    description: "Use fast-drying super glue to quickly fix breaks",
    duration: 1,
    isAppropriate: false, // Not reversible - violates conservation principles
  });

  processes.push({
    id: "process_duct_tape",
    name: "Duct Tape Reinforcement",
    category: "repair",
    description: "Wrap broken areas with duct tape for quick stabilization",
    duration: 1,
    isAppropriate: false, // Adhesive residue damages artifacts permanently
  });

  // PRESERVATION PROCESSES
  processes.push({
    id: "process_protective_coating",
    name: "Protective Coating",
    category: "preservation",
    description: "Apply protective coating to prevent future deterioration",
    duration: 1,
    isAppropriate: true, // Always appropriate as final step
  });

  processes.push({
    id: "process_wax_coating",
    name: "Wax Coating",
    category: "preservation",
    description: "Apply microcrystalline wax for protection",
    duration: 2,
    isAppropriate: isMetal,
  });

  processes.push({
    id: "process_humidity_control",
    name: "Humidity Control Storage",
    category: "preservation",
    description: "Store in controlled humidity environment",
    duration: 1,
    isAppropriate: hasOrganic || isMetal,
  });

  // DISTRACTOR PRESERVATION PROCESSES (inappropriate methods)
  processes.push({
    id: "process_nail_polish",
    name: "Clear Nail Polish Coating",
    category: "preservation",
    description: "Apply clear nail polish as a protective sealant",
    duration: 1,
    isAppropriate: false, // Not archival quality - can yellow and damage artifacts
  });

  processes.push({
    id: "process_spray_paint",
    name: "Clear Spray Paint Sealant",
    category: "preservation",
    description: "Spray with clear acrylic paint for protection",
    duration: 1,
    isAppropriate: false, // Not reversible and can obscure original surface
  });

  processes.push({
    id: "process_varnish",
    name: "Wood Varnish Coating",
    category: "preservation",
    description: "Apply wood varnish for a glossy protective finish",
    duration: 2,
    isAppropriate: false, // Inappropriate for archaeological artifacts - not reversible
  });

  // Shuffle and return a subset to add variety
  const shuffled = processes.sort(() => Math.random() - 0.5);

  // Return 8-12 processes
  const numProcesses = 8 + Math.floor(Math.random() * 5);
  return shuffled.slice(0, numProcesses);
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

function validateProcessOrderDetailed(
  order: string[],
  processes: ConservationProcess[]
): {
  isCorrect: boolean;
  errors: Array<{ processName: string; issue: string }>;
} {
  const errors: Array<{ processName: string; issue: string }> = [];

  // Map process IDs to their details
  const processMap = new Map(processes.map((p) => [p.id, p]));

  // Correct order: cleaning -> stabilization -> repair -> preservation
  const categoryOrder = ["cleaning", "stabilization", "repair", "preservation"];
  const categoryNames = {
    cleaning: "Cleaning",
    stabilization: "Stabilization",
    repair: "Repair",
    preservation: "Preservation",
  };

  let lastCategoryIndex = -1;

  for (let i = 0; i < order.length; i++) {
    const processId = order[i];
    const process = processMap.get(processId);

    if (!process) {
      continue;
    }

    const currentCategoryIndex = categoryOrder.indexOf(process.category);

    if (currentCategoryIndex < lastCategoryIndex) {
      // Found an out-of-order process
      const expectedCategory = categoryOrder[
        lastCategoryIndex
      ] as keyof typeof categoryNames;
      const actualCategory = process.category as keyof typeof categoryNames;

      errors.push({
        processName: process.name,
        issue: `${categoryNames[actualCategory]} process should come before ${categoryNames[expectedCategory]} processes. Conservation follows this order: Cleaning → Stabilization → Repair → Preservation.`,
      });
    }

    lastCategoryIndex = Math.max(lastCategoryIndex, currentCategoryIndex);
  }

  return {
    isCorrect: errors.length === 0,
    errors,
  };
}
