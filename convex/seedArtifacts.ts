import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed the database with sample artifacts for testing the artifact identification game
 */
export const seedArtifacts = mutation({
  args: {},
  returns: v.array(v.id("gameArtifacts")),
  handler: async (ctx, args) => {
    // Check if artifacts already exist
    const existingArtifacts = await ctx.db.query("gameArtifacts").collect();
    if (existingArtifacts.length > 0) {
      console.log("Artifacts already exist, skipping seed");
      return existingArtifacts.map((a) => a._id);
    }

    const sampleArtifacts = [
      {
        name: "Ancient Greek Amphora",
        description:
          "A large ceramic vessel used for storing wine and oil in ancient Greece",
        historicalPeriod: "Classical Antiquity",
        culture: "Ancient Greek",
        dateRange: "500-300 BCE",
        significance:
          "Essential for understanding ancient Greek trade and daily life",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "Mediterranean Sea, off the coast of Cyprus",
        conservationNotes:
          "Well-preserved due to underwater conditions, minimal restoration needed",
        difficulty: "beginner" as const,
        category: "Pottery",
        isActive: true,
      },
      {
        name: "Roman Bronze Coin",
        description: "A bronze sestertius from the reign of Emperor Trajan",
        historicalPeriod: "Roman Empire",
        culture: "Roman",
        dateRange: "98-117 CE",
        significance:
          "Provides insight into Roman monetary system and imperial propaganda",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "Adriatic Sea, near ancient Roman port",
        conservationNotes:
          "Significant corrosion, requires careful cleaning and stabilization",
        difficulty: "intermediate" as const,
        category: "Currency",
        isActive: true,
      },
      {
        name: "Viking Iron Sword",
        description:
          "A well-preserved iron sword with intricate hilt decorations",
        historicalPeriod: "Viking Age",
        culture: "Norse",
        dateRange: "800-1000 CE",
        significance: "Demonstrates Viking craftsmanship and warrior culture",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "Baltic Sea, near Swedish coastline",
        conservationNotes:
          "Excellent preservation in cold water, original leather grip remains",
        difficulty: "advanced" as const,
        category: "Weapons",
        isActive: true,
      },
      {
        name: "Phoenician Glass Vessel",
        description: "A delicate glass perfume bottle with iridescent patina",
        historicalPeriod: "Iron Age",
        culture: "Phoenician",
        dateRange: "800-500 BCE",
        significance: "Shows early glass-making techniques and trade networks",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "Eastern Mediterranean, off Lebanese coast",
        conservationNotes:
          "Fragile condition, requires specialized handling and display",
        difficulty: "intermediate" as const,
        category: "Glass",
        isActive: true,
      },
      {
        name: "Egyptian Canopic Jar",
        description:
          "A limestone jar used for storing organs during mummification",
        historicalPeriod: "New Kingdom",
        culture: "Ancient Egyptian",
        dateRange: "1550-1077 BCE",
        significance:
          "Reveals ancient Egyptian burial practices and religious beliefs",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "Red Sea, near ancient Egyptian port",
        conservationNotes:
          "Stone material well-preserved, hieroglyphic inscriptions intact",
        difficulty: "beginner" as const,
        category: "Religious",
        isActive: true,
      },
      {
        name: "Medieval Ship's Anchor",
        description: "A large iron anchor from a medieval merchant vessel",
        historicalPeriod: "Medieval",
        culture: "European",
        dateRange: "1200-1400 CE",
        significance:
          "Demonstrates medieval shipbuilding and maritime technology",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "North Sea, off English coast",
        conservationNotes: "Heavy corrosion, requires electrolytic treatment",
        difficulty: "advanced" as const,
        category: "Maritime",
        isActive: true,
      },
      {
        name: "Mayan Jade Ornament",
        description: "An intricately carved jade pendant with Mayan glyphs",
        historicalPeriod: "Classic Maya",
        culture: "Mayan",
        dateRange: "250-900 CE",
        significance: "Shows Mayan artistic skill and religious symbolism",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "Caribbean Sea, off Yucatan Peninsula",
        conservationNotes:
          "Excellent condition, jade naturally resistant to water damage",
        difficulty: "advanced" as const,
        category: "Jewelry",
        isActive: true,
      },
      {
        name: "Chinese Porcelain Bowl",
        description: "A blue and white porcelain bowl from the Ming Dynasty",
        historicalPeriod: "Ming Dynasty",
        culture: "Chinese",
        dateRange: "1368-1644 CE",
        significance: "Represents Chinese ceramic artistry and trade expansion",
        imageUrl: "/images/Gemini_Generated_Image_rzojr4rzojr4rzoj.png",
        discoveryLocation: "South China Sea, ancient trade route",
        conservationNotes: "Minor chips and cracks, glaze mostly intact",
        difficulty: "intermediate" as const,
        category: "Pottery",
        isActive: true,
      },
    ];

    const artifactIds = [];
    for (const artifact of sampleArtifacts) {
      const id = await ctx.db.insert("gameArtifacts", artifact);
      artifactIds.push(id);
    }

    console.log(`Created ${artifactIds.length} sample artifacts`);
    return artifactIds;
  },
});
