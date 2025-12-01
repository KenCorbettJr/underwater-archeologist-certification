import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Update artifact images with unique placeholders
 * Run this once to update all artifact images
 */
export const updateArtifactImages = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx, args) => {
    const artifacts = await ctx.db.query("gameArtifacts").collect();

    const imageMap: Record<string, string> = {
      "Ancient Greek Amphora":
        "https://placehold.co/400x400/1e3a8a/fbbf24?text=Greek+Amphora+🏺",
      "Roman Bronze Coin":
        "https://placehold.co/400x400/8b4513/ffd700?text=Roman+Coin+🪙",
      "Viking Iron Sword":
        "https://placehold.co/400x400/4b5563/e5e7eb?text=Viking+Sword+⚔️",
      "Phoenician Glass Vessel":
        "https://placehold.co/400x400/06b6d4/e0f2fe?text=Glass+Vessel+🫙",
      "Egyptian Canopic Jar":
        "https://placehold.co/400x400/d97706/fef3c7?text=Canopic+Jar+🏺",
      "Medieval Ship's Anchor":
        "https://placehold.co/400x400/374151/9ca3af?text=Ship+Anchor+⚓",
      "Mayan Jade Ornament":
        "https://placehold.co/400x400/059669/d1fae5?text=Jade+Ornament+💎",
      "Chinese Porcelain Bowl":
        "https://placehold.co/400x400/1e40af/dbeafe?text=Porcelain+Bowl+🥣",
      "Aztec Stone Calendar":
        "https://placehold.co/400x400/78350f/fed7aa?text=Stone+Calendar+📅",
      "Persian Silver Dagger":
        "https://placehold.co/400x400/6b7280/f3f4f6?text=Silver+Dagger+🗡️",
      "Celtic Bronze Torc":
        "https://placehold.co/400x400/92400e/fef08a?text=Bronze+Torc+⭕",
      "Japanese Samurai Helmet":
        "https://placehold.co/400x400/7f1d1d/fecaca?text=Samurai+Helmet+🪖",
      "Mesopotamian Clay Tablet":
        "https://placehold.co/400x400/a16207/fef3c7?text=Clay+Tablet+📜",
      "Byzantine Gold Cross":
        "https://placehold.co/400x400/b45309/fef3c7?text=Gold+Cross+✝️",
      "Polynesian Stone Adze":
        "https://placehold.co/400x400/57534e/e7e5e4?text=Stone+Adze+🪓",
      "Inca Silver Llama Figurine":
        "https://placehold.co/400x400/71717a/f4f4f5?text=Silver+Llama+🦙",
      "Etruscan Bronze Mirror":
        "https://placehold.co/400x400/713f12/fde68a?text=Bronze+Mirror+🪞",
      "Minoan Bull Rhyton":
        "https://placehold.co/400x400/b91c1c/fecaca?text=Bull+Rhyton+🐂",
      "Anglo-Saxon Gold Brooch":
        "https://placehold.co/400x400/ca8a04/fef9c3?text=Gold+Brooch+📌",
      "Carthaginian Trade Amphora":
        "https://placehold.co/400x400/92400e/fed7aa?text=Trade+Amphora+🏺",
      "Olmec Jade Mask":
        "https://placehold.co/400x400/065f46/d1fae5?text=Jade+Mask+🎭",
      "Scythian Gold Comb":
        "https://placehold.co/400x400/eab308/fef9c3?text=Gold+Comb+💇",
      "Nabataean Pottery Lamp":
        "https://placehold.co/400x400/c2410c/fed7aa?text=Pottery+Lamp+🪔",
      "Khmer Bronze Buddha":
        "https://placehold.co/400x400/78350f/fed7aa?text=Bronze+Buddha+🧘",
      "Phoenician Ivory Plaque":
        "https://placehold.co/400x400/fef3c7/78350f?text=Ivory+Plaque+🖼️",
      "Mycenaean Gold Death Mask":
        "https://placehold.co/400x400/f59e0b/fef3c7?text=Gold+Mask+😶",
      "Hittite Iron Spearhead":
        "https://placehold.co/400x400/52525b/e4e4e7?text=Iron+Spear+🔱",
      "Nubian Gold Earring":
        "https://placehold.co/400x400/d97706/fef3c7?text=Gold+Earring+👂",
    };

    let updateCount = 0;
    for (const artifact of artifacts) {
      const newImageUrl = imageMap[artifact.name];
      if (newImageUrl && artifact.imageUrl !== newImageUrl) {
        await ctx.db.patch(artifact._id, {
          imageUrl: newImageUrl,
        });
        updateCount++;
      }
    }

    console.log(`Updated ${updateCount} artifact images`);
    return updateCount;
  },
});
