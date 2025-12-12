import { expect, test, describe } from "vitest";

// Unit tests for conservation lab process ordering validation
// Tests the ordering logic for conservation processes

interface ConservationProcess {
  id: string;
  name: string;
  category: "cleaning" | "stabilization" | "repair" | "preservation";
  description: string;
  duration: number;
  isAppropriate: boolean;
}

// Helper function to validate process order (copied from conservationLabGame.ts)
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

describe("Conservation Lab Process Ordering", () => {
  const mockProcesses: ConservationProcess[] = [
    {
      id: "process_gentle_cleaning",
      name: "Gentle Cleaning",
      category: "cleaning",
      description: "Remove loose sediment",
      duration: 2,
      isAppropriate: true,
    },
    {
      id: "process_chemical_bath",
      name: "Chemical Bath",
      category: "cleaning",
      description: "Soak in cleaning solution",
      duration: 4,
      isAppropriate: true,
    },
    {
      id: "process_consolidation",
      name: "Consolidation",
      category: "stabilization",
      description: "Strengthen fragile areas",
      duration: 3,
      isAppropriate: true,
    },
    {
      id: "process_adhesive_repair",
      name: "Adhesive Repair",
      category: "repair",
      description: "Rejoin broken fragments",
      duration: 2,
      isAppropriate: true,
    },
    {
      id: "process_protective_coating",
      name: "Protective Coating",
      category: "preservation",
      description: "Apply protective coating",
      duration: 1,
      isAppropriate: true,
    },
  ];

  test("should validate correct process order", () => {
    const correctOrder = [
      "process_gentle_cleaning", // cleaning
      "process_consolidation", // stabilization
      "process_adhesive_repair", // repair
      "process_protective_coating", // preservation
    ];

    const result = validateProcessOrderDetailed(correctOrder, mockProcesses);

    expect(result.isCorrect).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should detect incorrect process order", () => {
    const incorrectOrder = [
      "process_gentle_cleaning", // cleaning
      "process_adhesive_repair", // repair (WRONG - should be after stabilization)
      "process_consolidation", // stabilization (WRONG - should be before repair)
      "process_protective_coating", // preservation
    ];

    const result = validateProcessOrderDetailed(incorrectOrder, mockProcesses);

    expect(result.isCorrect).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].processName).toBe("Consolidation");
    expect(result.errors[0].issue).toContain("Stabilization");
    expect(result.errors[0].issue).toContain("Repair");
  });

  test("should detect multiple ordering errors", () => {
    const completelyWrongOrder = [
      "process_protective_coating", // preservation (WRONG - should be last)
      "process_adhesive_repair", // repair (WRONG)
      "process_consolidation", // stabilization (WRONG)
      "process_gentle_cleaning", // cleaning (WRONG - should be first)
    ];

    const result = validateProcessOrderDetailed(
      completelyWrongOrder,
      mockProcesses
    );

    expect(result.isCorrect).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Check that errors mention the correct categories
    const errorMessages = result.errors.map((e) => e.issue).join(" ");
    expect(errorMessages).toContain("Cleaning");
  });

  test("should allow same category processes in any order", () => {
    const sameCategoryOrder = [
      "process_chemical_bath", // cleaning
      "process_gentle_cleaning", // cleaning (different order within same category)
      "process_protective_coating", // preservation
    ];

    const result = validateProcessOrderDetailed(
      sameCategoryOrder,
      mockProcesses
    );

    expect(result.isCorrect).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should handle single process", () => {
    const singleProcess = ["process_gentle_cleaning"];

    const result = validateProcessOrderDetailed(singleProcess, mockProcesses);

    expect(result.isCorrect).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should handle empty process list", () => {
    const emptyOrder: string[] = [];

    const result = validateProcessOrderDetailed(emptyOrder, mockProcesses);

    expect(result.isCorrect).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should allow skipping categories", () => {
    // It's valid to skip categories (e.g., go from cleaning directly to preservation)
    const skippedCategories = [
      "process_gentle_cleaning", // cleaning
      "process_protective_coating", // preservation (skipping stabilization and repair)
    ];

    const result = validateProcessOrderDetailed(
      skippedCategories,
      mockProcesses
    );

    expect(result.isCorrect).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should detect preservation before cleaning", () => {
    const wrongOrder = [
      "process_protective_coating", // preservation (WRONG - should be after cleaning)
      "process_gentle_cleaning", // cleaning
    ];

    const result = validateProcessOrderDetailed(wrongOrder, mockProcesses);

    expect(result.isCorrect).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].processName).toBe("Gentle Cleaning");
  });
});
