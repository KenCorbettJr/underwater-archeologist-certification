import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Validators for excavation site data structures
const environmentalConditionsValidator = v.object({
  visibility: v.number(), // 0-100 percentage
  currentStrength: v.number(), // 0-10 scale
  temperature: v.number(), // in Celsius
  depth: v.number(), // in meters
  sedimentType: v.string(),
  timeConstraints: v.number(), // in minutes
});

const siteArtifactValidator = v.object({
  artifactId: v.id("gameArtifacts"),
  gridPosition: v.object({
    x: v.number(),
    y: v.number(),
  }),
  depth: v.number(), // depth in grid cell (0-1, where 1 is fully buried)
  isDiscovered: v.boolean(),
  condition: v.union(
    v.literal("excellent"),
    v.literal("good"),
    v.literal("fair"),
    v.literal("poor")
  ),
});

/**
 * Create a new excavation site with grid system and artifact placement
 */
export const createExcavationSite = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    historicalPeriod: v.string(),
    description: v.string(),
    gridWidth: v.number(),
    gridHeight: v.number(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    environmentalConditions: environmentalConditionsValidator,
    siteArtifacts: v.array(siteArtifactValidator),
  },
  returns: v.id("excavationSites"),
  handler: async (ctx, args) => {
    // Validate grid dimensions
    if (args.gridWidth < 3 || args.gridWidth > 20) {
      throw new Error("Grid width must be between 3 and 20");
    }
    if (args.gridHeight < 3 || args.gridHeight > 20) {
      throw new Error("Grid height must be between 3 and 20");
    }

    // Validate environmental conditions
    if (
      args.environmentalConditions.visibility < 0 ||
      args.environmentalConditions.visibility > 100
    ) {
      throw new Error("Visibility must be between 0 and 100");
    }
    if (
      args.environmentalConditions.currentStrength < 0 ||
      args.environmentalConditions.currentStrength > 10
    ) {
      throw new Error("Current strength must be between 0 and 10");
    }

    // Validate artifact positions are within grid bounds
    for (const artifact of args.siteArtifacts) {
      if (
        artifact.gridPosition.x < 0 ||
        artifact.gridPosition.x >= args.gridWidth
      ) {
        throw new Error(
          `Artifact position x (${artifact.gridPosition.x}) is outside grid bounds`
        );
      }
      if (
        artifact.gridPosition.y < 0 ||
        artifact.gridPosition.y >= args.gridHeight
      ) {
        throw new Error(
          `Artifact position y (${artifact.gridPosition.y}) is outside grid bounds`
        );
      }
      if (artifact.depth < 0 || artifact.depth > 1) {
        throw new Error("Artifact depth must be between 0 and 1");
      }
    }

    // Verify all referenced artifacts exist
    for (const artifact of args.siteArtifacts) {
      const gameArtifact = await ctx.db.get(artifact.artifactId);
      if (!gameArtifact) {
        throw new Error(
          `Referenced artifact ${artifact.artifactId} does not exist`
        );
      }
    }

    return await ctx.db.insert("excavationSites", {
      name: args.name,
      location: args.location,
      historicalPeriod: args.historicalPeriod,
      description: args.description,
      gridWidth: args.gridWidth,
      gridHeight: args.gridHeight,
      difficulty: args.difficulty,
      environmentalConditions: JSON.stringify(args.environmentalConditions),
      siteArtifacts: args.siteArtifacts.map((artifact) =>
        JSON.stringify(artifact)
      ),
      isActive: true,
    });
  },
});

/**
 * Get excavation sites by difficulty level
 */
export const getExcavationSitesByDifficulty = query({
  args: {
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("excavationSites"),
      _creationTime: v.number(),
      name: v.string(),
      location: v.string(),
      historicalPeriod: v.string(),
      description: v.string(),
      gridWidth: v.number(),
      gridHeight: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      environmentalConditions: environmentalConditionsValidator,
      siteArtifacts: v.array(siteArtifactValidator),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const sites = await ctx.db
      .query("excavationSites")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return sites.map((site) => ({
      ...site,
      environmentalConditions: JSON.parse(site.environmentalConditions),
      siteArtifacts: site.siteArtifacts.map((artifact) => JSON.parse(artifact)),
    }));
  },
});

/**
 * Get a specific excavation site by ID
 */
export const getExcavationSite = query({
  args: {
    siteId: v.id("excavationSites"),
  },
  returns: v.union(
    v.object({
      _id: v.id("excavationSites"),
      _creationTime: v.number(),
      name: v.string(),
      location: v.string(),
      historicalPeriod: v.string(),
      description: v.string(),
      gridWidth: v.number(),
      gridHeight: v.number(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      environmentalConditions: environmentalConditionsValidator,
      siteArtifacts: v.array(siteArtifactValidator),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site || !site.isActive) {
      return null;
    }

    return {
      ...site,
      environmentalConditions: JSON.parse(site.environmentalConditions),
      siteArtifacts: site.siteArtifacts.map((artifact) => JSON.parse(artifact)),
    };
  },
});

/**
 * Generate a random excavation site for practice
 */
export const generateRandomExcavationSite = mutation({
  args: {
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  returns: v.id("excavationSites"),
  handler: async (ctx, args) => {
    // Get available artifacts for the difficulty level
    const availableArtifacts = await ctx.db
      .query("gameArtifacts")
      .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (availableArtifacts.length === 0) {
      throw new Error(
        `No artifacts available for difficulty level: ${args.difficulty}`
      );
    }

    // Generate site parameters based on difficulty
    const siteParams = generateSiteParameters(args.difficulty);

    // Select random artifacts for the site
    const numArtifacts = Math.min(
      siteParams.maxArtifacts,
      Math.floor(
        Math.random() * (siteParams.maxArtifacts - siteParams.minArtifacts + 1)
      ) + siteParams.minArtifacts
    );

    const selectedArtifacts = [];
    const usedPositions = new Set<string>();

    for (
      let i = 0;
      i < numArtifacts && selectedArtifacts.length < availableArtifacts.length;
      i++
    ) {
      const artifact =
        availableArtifacts[
          Math.floor(Math.random() * availableArtifacts.length)
        ];

      // Generate random position that doesn't overlap
      let position;
      let attempts = 0;
      do {
        position = {
          x: Math.floor(Math.random() * siteParams.gridWidth),
          y: Math.floor(Math.random() * siteParams.gridHeight),
        };
        attempts++;
      } while (
        usedPositions.has(`${position.x},${position.y}`) &&
        attempts < 50
      );

      if (attempts >= 50) break; // Avoid infinite loop

      usedPositions.add(`${position.x},${position.y}`);

      selectedArtifacts.push({
        artifactId: artifact._id,
        gridPosition: position,
        depth: Math.random() * 0.8 + 0.2, // 0.2 to 1.0 depth
        isDiscovered: false,
        condition: generateRandomCondition(),
      });
    }

    // Generate site name and description
    const siteData = generateSiteData(
      args.difficulty,
      siteParams.historicalPeriod
    );

    return await ctx.db.insert("excavationSites", {
      name: siteData.name,
      location: siteData.location,
      historicalPeriod: siteParams.historicalPeriod,
      description: siteData.description,
      gridWidth: siteParams.gridWidth,
      gridHeight: siteParams.gridHeight,
      difficulty: args.difficulty,
      environmentalConditions: JSON.stringify(
        siteParams.environmentalConditions
      ),
      siteArtifacts: selectedArtifacts.map((artifact) =>
        JSON.stringify(artifact)
      ),
      isActive: true,
    });
  },
});

/**
 * Update artifact discovery status in an excavation site
 */
export const updateArtifactDiscovery = mutation({
  args: {
    siteId: v.id("excavationSites"),
    artifactId: v.id("gameArtifacts"),
    isDiscovered: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Excavation site not found");
    }

    const siteArtifacts = site.siteArtifacts.map((artifactStr) =>
      JSON.parse(artifactStr)
    );
    const artifactIndex = siteArtifacts.findIndex(
      (artifact) => artifact.artifactId === args.artifactId
    );

    if (artifactIndex === -1) {
      throw new Error("Artifact not found in this excavation site");
    }

    siteArtifacts[artifactIndex].isDiscovered = args.isDiscovered;

    await ctx.db.patch(args.siteId, {
      siteArtifacts: siteArtifacts.map((artifact) => JSON.stringify(artifact)),
    });

    return null;
  },
});

// Helper functions for site generation
function generateSiteParameters(
  difficulty: "beginner" | "intermediate" | "advanced"
) {
  const baseParams = {
    beginner: {
      gridWidth: 5,
      gridHeight: 5,
      minArtifacts: 2,
      maxArtifacts: 4,
      historicalPeriods: ["Ancient Roman", "Medieval", "Colonial"],
    },
    intermediate: {
      gridWidth: 8,
      gridHeight: 8,
      minArtifacts: 4,
      maxArtifacts: 8,
      historicalPeriods: [
        "Ancient Greek",
        "Byzantine",
        "Renaissance",
        "Industrial",
      ],
    },
    advanced: {
      gridWidth: 12,
      gridHeight: 12,
      minArtifacts: 6,
      maxArtifacts: 12,
      historicalPeriods: [
        "Prehistoric",
        "Ancient Egyptian",
        "Viking",
        "Modern",
      ],
    },
  };

  const params = baseParams[difficulty];
  const historicalPeriod =
    params.historicalPeriods[
      Math.floor(Math.random() * params.historicalPeriods.length)
    ];

  return {
    gridWidth: params.gridWidth,
    gridHeight: params.gridHeight,
    minArtifacts: params.minArtifacts,
    maxArtifacts: params.maxArtifacts,
    historicalPeriod,
    environmentalConditions: generateEnvironmentalConditions(difficulty),
  };
}

function generateEnvironmentalConditions(
  difficulty: "beginner" | "intermediate" | "advanced"
) {
  const conditions = {
    beginner: {
      visibility: 80 + Math.random() * 20, // 80-100%
      currentStrength: Math.random() * 3, // 0-3
      temperature: 15 + Math.random() * 10, // 15-25°C
      depth: 5 + Math.random() * 10, // 5-15m
      timeConstraints: 45 + Math.random() * 15, // 45-60 minutes
    },
    intermediate: {
      visibility: 50 + Math.random() * 40, // 50-90%
      currentStrength: Math.random() * 6, // 0-6
      temperature: 10 + Math.random() * 15, // 10-25°C
      depth: 10 + Math.random() * 20, // 10-30m
      timeConstraints: 30 + Math.random() * 20, // 30-50 minutes
    },
    advanced: {
      visibility: 20 + Math.random() * 60, // 20-80%
      currentStrength: Math.random() * 10, // 0-10
      temperature: 5 + Math.random() * 20, // 5-25°C
      depth: 15 + Math.random() * 35, // 15-50m
      timeConstraints: 20 + Math.random() * 25, // 20-45 minutes
    },
  };

  const baseConditions = conditions[difficulty];
  const sedimentTypes = ["sand", "silt", "clay", "rocky", "coral"];

  return {
    visibility: Math.round(baseConditions.visibility),
    currentStrength: Math.round(baseConditions.currentStrength * 10) / 10,
    temperature: Math.round(baseConditions.temperature * 10) / 10,
    depth: Math.round(baseConditions.depth * 10) / 10,
    sedimentType:
      sedimentTypes[Math.floor(Math.random() * sedimentTypes.length)],
    timeConstraints: Math.round(baseConditions.timeConstraints),
  };
}

function generateRandomCondition(): "excellent" | "good" | "fair" | "poor" {
  const rand = Math.random();
  if (rand < 0.3) return "excellent";
  if (rand < 0.6) return "good";
  if (rand < 0.85) return "fair";
  return "poor";
}

function generateSiteData(difficulty: string, historicalPeriod: string) {
  const siteNames = {
    "Ancient Roman": ["Villa Maritima", "Portus Romanus", "Thermae Submarinae"],
    Medieval: ["Monastery Ruins", "Castle Harbor", "Merchant Vessel"],
    Colonial: ["Trading Post", "Colonial Settlement", "Shipwreck Bay"],
    "Ancient Greek": ["Amphora Field", "Temple Ruins", "Agora Submersa"],
    Byzantine: ["Imperial Harbor", "Basilica Ruins", "Trade Route"],
    Renaissance: ["Palazzo Sommerso", "Artisan Quarter", "Noble Villa"],
    Industrial: ["Factory Ruins", "Steam Ship", "Industrial Harbor"],
    Prehistoric: ["Cave Dwelling", "Stone Age Site", "Primitive Settlement"],
    "Ancient Egyptian": ["Temple Complex", "Royal Barge", "Sacred Pool"],
    Viking: ["Longship Wreck", "Trading Post", "Warrior's Hall"],
    Modern: ["Research Station", "Modern Wreck", "Contemporary Site"],
  };

  const locations = [
    "Mediterranean Sea",
    "Aegean Sea",
    "Black Sea",
    "Atlantic Ocean",
    "Caribbean Sea",
    "Red Sea",
    "Baltic Sea",
    "North Sea",
  ];

  const names = siteNames[historicalPeriod as keyof typeof siteNames] || [
    "Unknown Site",
  ];
  const siteName = names[Math.floor(Math.random() * names.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];

  const descriptions = {
    beginner: `A well-preserved ${historicalPeriod.toLowerCase()} site in the ${location}. This site offers excellent visibility and calm conditions, making it perfect for learning basic excavation techniques.`,
    intermediate: `A moderately challenging ${historicalPeriod.toLowerCase()} site in the ${location}. Variable conditions require careful planning and proper archaeological protocols.`,
    advanced: `A complex ${historicalPeriod.toLowerCase()} site in the ${location}. Challenging environmental conditions and delicate artifacts require advanced excavation skills and experience.`,
  };

  return {
    name: siteName,
    location,
    description:
      descriptions[difficulty as keyof typeof descriptions] ||
      descriptions.beginner,
  };
}
