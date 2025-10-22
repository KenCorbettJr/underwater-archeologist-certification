import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed the database with initial excavation sites
 * This ensures we have at least 3 different underwater archaeological sites
 */
export const seedExcavationSites = mutation({
  args: {},
  returns: v.array(v.id("excavationSites")),
  handler: async (ctx, args) => {
    // Check if sites already exist
    const existingSites = await ctx.db.query("excavationSites").collect();
    if (existingSites.length > 0) {
      return existingSites.map((site) => site._id);
    }

    // Get some artifacts to place in sites
    const artifacts = await ctx.db.query("gameArtifacts").collect();
    if (artifacts.length === 0) {
      throw new Error("No artifacts available. Please seed artifacts first.");
    }

    const siteIds = [];

    // Site 1: Beginner - Roman Villa
    const romanSiteId = await ctx.db.insert("excavationSites", {
      name: "Villa Maritima Romana",
      location: "Mediterranean Sea, Italy",
      historicalPeriod: "Ancient Roman",
      description:
        "A well-preserved Roman villa submerged off the Italian coast. This site offers excellent visibility and calm conditions, perfect for learning basic underwater excavation techniques. The villa contains beautiful mosaics and everyday Roman artifacts.",
      gridWidth: 6,
      gridHeight: 6,
      difficulty: "beginner",
      environmentalConditions: JSON.stringify({
        visibility: 90,
        currentStrength: 1.5,
        temperature: 22,
        depth: 8,
        sedimentType: "sand",
        timeConstraints: 50,
      }),
      siteArtifacts: [
        JSON.stringify({
          artifactId: artifacts[0]._id,
          gridPosition: { x: 2, y: 2 },
          depth: 0.3,
          isDiscovered: false,
          condition: "good",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(1, artifacts.length - 1)]._id,
          gridPosition: { x: 4, y: 3 },
          depth: 0.5,
          isDiscovered: false,
          condition: "excellent",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(2, artifacts.length - 1)]._id,
          gridPosition: { x: 1, y: 4 },
          depth: 0.4,
          isDiscovered: false,
          condition: "fair",
        }),
      ],
      isActive: true,
    });
    siteIds.push(romanSiteId);

    // Site 2: Intermediate - Medieval Shipwreck
    const medievalSiteId = await ctx.db.insert("excavationSites", {
      name: "Medieval Merchant Vessel",
      location: "North Sea, England",
      historicalPeriod: "Medieval",
      description:
        "A 14th-century merchant ship that sank during a storm. The wreck is partially buried in silt and requires careful excavation techniques. Contains trade goods, navigation instruments, and personal belongings of the crew.",
      gridWidth: 8,
      gridHeight: 10,
      difficulty: "intermediate",
      environmentalConditions: JSON.stringify({
        visibility: 65,
        currentStrength: 4.2,
        temperature: 12,
        depth: 18,
        sedimentType: "silt",
        timeConstraints: 40,
      }),
      siteArtifacts: [
        JSON.stringify({
          artifactId: artifacts[Math.min(3, artifacts.length - 1)]._id,
          gridPosition: { x: 3, y: 4 },
          depth: 0.7,
          isDiscovered: false,
          condition: "fair",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(4, artifacts.length - 1)]._id,
          gridPosition: { x: 5, y: 6 },
          depth: 0.6,
          isDiscovered: false,
          condition: "good",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(5, artifacts.length - 1)]._id,
          gridPosition: { x: 2, y: 7 },
          depth: 0.8,
          isDiscovered: false,
          condition: "poor",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(6, artifacts.length - 1)]._id,
          gridPosition: { x: 6, y: 3 },
          depth: 0.5,
          isDiscovered: false,
          condition: "excellent",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(7, artifacts.length - 1)]._id,
          gridPosition: { x: 1, y: 8 },
          depth: 0.9,
          isDiscovered: false,
          condition: "fair",
        }),
      ],
      isActive: true,
    });
    siteIds.push(medievalSiteId);

    // Site 3: Advanced - Ancient Greek Temple
    const greekSiteId = await ctx.db.insert("excavationSites", {
      name: "Temple of Poseidon Submerged",
      location: "Aegean Sea, Greece",
      description:
        "An ancient Greek temple complex dedicated to Poseidon, submerged due to seismic activity. The site presents challenging conditions with strong currents and limited visibility. Contains rare religious artifacts, architectural elements, and votive offerings.",
      gridWidth: 12,
      gridHeight: 12,
      difficulty: "advanced",
      historicalPeriod: "Ancient Greek",
      environmentalConditions: JSON.stringify({
        visibility: 45,
        currentStrength: 7.8,
        temperature: 16,
        depth: 25,
        sedimentType: "rocky",
        timeConstraints: 35,
      }),
      siteArtifacts: [
        JSON.stringify({
          artifactId: artifacts[Math.min(8, artifacts.length - 1)]._id,
          gridPosition: { x: 6, y: 6 },
          depth: 0.8,
          isDiscovered: false,
          condition: "excellent",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(9, artifacts.length - 1)]._id,
          gridPosition: { x: 4, y: 8 },
          depth: 0.9,
          isDiscovered: false,
          condition: "good",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(10, artifacts.length - 1)]._id,
          gridPosition: { x: 9, y: 4 },
          depth: 0.7,
          isDiscovered: false,
          condition: "fair",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(11, artifacts.length - 1)]._id,
          gridPosition: { x: 2, y: 10 },
          depth: 0.95,
          isDiscovered: false,
          condition: "poor",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(12, artifacts.length - 1)]._id,
          gridPosition: { x: 10, y: 2 },
          depth: 0.6,
          isDiscovered: false,
          condition: "good",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(13, artifacts.length - 1)]._id,
          gridPosition: { x: 7, y: 9 },
          depth: 0.85,
          isDiscovered: false,
          condition: "excellent",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(14, artifacts.length - 1)]._id,
          gridPosition: { x: 3, y: 3 },
          depth: 0.75,
          isDiscovered: false,
          condition: "fair",
        }),
        JSON.stringify({
          artifactId: artifacts[Math.min(15, artifacts.length - 1)]._id,
          gridPosition: { x: 11, y: 7 },
          depth: 0.9,
          isDiscovered: false,
          condition: "good",
        }),
      ],
      isActive: true,
    });
    siteIds.push(greekSiteId);

    return siteIds;
  },
});

/**
 * Get all active excavation sites for overview
 */
export const getAllExcavationSites = mutation({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("excavationSites"),
      name: v.string(),
      location: v.string(),
      historicalPeriod: v.string(),
      description: v.string(),
      difficulty: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      ),
      gridWidth: v.number(),
      gridHeight: v.number(),
      artifactCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const sites = await ctx.db
      .query("excavationSites")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return sites.map((site) => ({
      _id: site._id,
      name: site.name,
      location: site.location,
      historicalPeriod: site.historicalPeriod,
      description: site.description,
      difficulty: site.difficulty,
      gridWidth: site.gridWidth,
      gridHeight: site.gridHeight,
      artifactCount: site.siteArtifacts.length,
    }));
  },
});
