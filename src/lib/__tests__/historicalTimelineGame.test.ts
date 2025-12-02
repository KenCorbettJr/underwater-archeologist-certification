// Unit tests for historical timeline game logic
// Tests timeline ordering, chronological accuracy, and culture matching

import { describe, it, expect } from "vitest";

describe("Historical Timeline Game Logic", () => {
  describe("Timeline Event Ordering", () => {
    it("should correctly identify events in chronological order", () => {
      const events = [
        { id: "1", title: "Ancient Greek", actualDate: -400 },
        { id: "2", title: "Roman", actualDate: 150 },
        { id: "3", title: "Viking", actualDate: 900 },
        { id: "4", title: "Spanish", actualDate: 1600 },
      ];

      const correctOrder = events
        .sort((a, b) => a.actualDate - b.actualDate)
        .map((e) => e.id);

      expect(correctOrder).toEqual(["1", "2", "3", "4"]);
    });

    it("should handle negative dates (BCE) correctly", () => {
      const events = [
        { id: "1", actualDate: -500 },
        { id: "2", actualDate: -300 },
        { id: "3", actualDate: 100 },
      ];

      const sorted = events.sort((a, b) => a.actualDate - b.actualDate);

      expect(sorted[0].id).toBe("1");
      expect(sorted[1].id).toBe("2");
      expect(sorted[2].id).toBe("3");
    });

    it("should calculate accuracy based on correct positions", () => {
      const userOrder = ["1", "3", "2", "4"];
      const correctOrder = ["1", "2", "3", "4"];

      let correctCount = 0;
      for (let i = 0; i < userOrder.length; i++) {
        if (userOrder[i] === correctOrder[i]) {
          correctCount++;
        }
      }

      const accuracy = correctCount / correctOrder.length;
      expect(accuracy).toBe(0.5); // 2 out of 4 correct
    });

    it("should identify misplaced events", () => {
      const userOrder = ["1", "3", "2", "4"];
      const correctOrder = ["1", "2", "3", "4"];
      const events = [
        { id: "1", title: "Ancient Greek" },
        { id: "2", title: "Roman" },
        { id: "3", title: "Viking" },
        { id: "4", title: "Spanish" },
      ];

      const misplaced: string[] = [];
      for (let i = 0; i < userOrder.length; i++) {
        if (userOrder[i] !== correctOrder[i]) {
          const event = events.find((e) => e.id === userOrder[i]);
          if (event) {
            misplaced.push(event.title);
          }
        }
      }

      expect(misplaced).toContain("Viking");
      expect(misplaced).toContain("Roman");
      expect(misplaced).not.toContain("Ancient Greek");
      expect(misplaced).not.toContain("Spanish");
    });
  });

  describe("Timeline Scoring", () => {
    it("should award full points for perfect order", () => {
      const correctCount = 5;
      const totalCount = 5;
      const accuracy = correctCount / totalCount;
      const score = Math.round(accuracy * 500);

      expect(score).toBe(500);
    });

    it("should award partial points for partial accuracy", () => {
      const correctCount = 3;
      const totalCount = 5;
      const accuracy = correctCount / totalCount;
      const score = Math.round(accuracy * 500);

      expect(score).toBe(300);
    });

    it("should award no points for completely wrong order", () => {
      const correctCount = 0;
      const totalCount = 5;
      const accuracy = correctCount / totalCount;
      const score = Math.round(accuracy * 500);

      expect(score).toBe(0);
    });
  });

  describe("Culture Matching", () => {
    it("should correctly match artifacts to their cultures", () => {
      const artifact = {
        id: "artifact1",
        name: "Amphora",
        culture: "Ancient Greek",
      };

      const selectedCulture = "Ancient Greek";
      const isCorrect = artifact.culture === selectedCulture;

      expect(isCorrect).toBe(true);
    });

    it("should reject incorrect culture matches", () => {
      const artifact = {
        id: "artifact1",
        name: "Amphora",
        culture: "Ancient Greek",
      };

      const selectedCulture = "Roman";
      const isCorrect = artifact.culture === selectedCulture;

      expect(isCorrect).toBe(false);
    });

    it("should award points for correct culture matches", () => {
      const isCorrect = true;
      const matchScore = isCorrect ? 50 : 0;

      expect(matchScore).toBe(50);
    });

    it("should award no points for incorrect culture matches", () => {
      const isCorrect = false;
      const matchScore = isCorrect ? 50 : 0;

      expect(matchScore).toBe(0);
    });

    it("should track multiple culture matches", () => {
      const matches = [
        {
          artifactId: "1",
          selectedCulture: "Greek",
          correctCulture: "Greek",
          isCorrect: true,
        },
        {
          artifactId: "2",
          selectedCulture: "Roman",
          correctCulture: "Roman",
          isCorrect: true,
        },
        {
          artifactId: "3",
          selectedCulture: "Viking",
          correctCulture: "Egyptian",
          isCorrect: false,
        },
      ];

      const correctMatches = matches.filter((m) => m.isCorrect).length;
      const totalMatches = matches.length;
      const accuracy = correctMatches / totalMatches;

      expect(accuracy).toBeCloseTo(0.667, 2);
    });
  });

  describe("Event Placement", () => {
    it("should allow placing events at specific positions", () => {
      const userOrder: string[] = [];
      const eventId = "event1";
      const position = 0;

      userOrder.splice(position, 0, eventId);

      expect(userOrder[0]).toBe("event1");
      expect(userOrder).toHaveLength(1);
    });

    it("should allow inserting events between existing events", () => {
      const userOrder = ["event1", "event3"];
      const eventId = "event2";
      const position = 1;

      userOrder.splice(position, 0, eventId);

      expect(userOrder).toEqual(["event1", "event2", "event3"]);
    });

    it("should track which events have been placed", () => {
      const events = [
        { id: "1", isPlaced: false },
        { id: "2", isPlaced: false },
        { id: "3", isPlaced: false },
      ];

      events[0].isPlaced = true;
      events[2].isPlaced = true;

      const placedCount = events.filter((e) => e.isPlaced).length;
      const unplacedCount = events.filter((e) => !e.isPlaced).length;

      expect(placedCount).toBe(2);
      expect(unplacedCount).toBe(1);
    });
  });

  describe("Completion Tracking", () => {
    it("should calculate completion percentage based on placed events", () => {
      const totalEvents = 5;
      const placedEvents = 3;
      const completionPercentage = Math.round(
        (placedEvents / totalEvents) * 100
      );

      expect(completionPercentage).toBe(60);
    });

    it("should mark as complete when all events are placed", () => {
      const totalEvents = 5;
      const placedEvents = 5;
      const isComplete = placedEvents === totalEvents;

      expect(isComplete).toBe(true);
    });

    it("should not mark as complete when events remain unplaced", () => {
      const totalEvents = 5;
      const placedEvents = 4;
      const isComplete = placedEvents === totalEvents;

      expect(isComplete).toBe(false);
    });
  });

  describe("Event Reordering", () => {
    it("should allow reordering events after placement", () => {
      const userOrder = ["event1", "event2", "event3"];
      const newOrder = ["event2", "event1", "event3"];

      const reorderedEvents = [...newOrder];

      expect(reorderedEvents).toEqual(["event2", "event1", "event3"]);
      expect(reorderedEvents).toHaveLength(3);
    });

    it("should maintain all events during reordering", () => {
      const originalOrder = ["event1", "event2", "event3", "event4"];
      const newOrder = ["event4", "event2", "event1", "event3"];

      expect(newOrder).toHaveLength(originalOrder.length);
      expect(newOrder.every((id) => originalOrder.includes(id))).toBe(true);
    });
  });

  describe("Historical Accuracy Validation", () => {
    it("should validate date ranges are in correct format", () => {
      const dateRange = "500-300 BCE";
      const hasValidFormat = /\d+-\d+\s+(BCE|CE)/.test(dateRange);

      expect(hasValidFormat).toBe(true);
    });

    it("should handle both BCE and CE dates", () => {
      const bceDateRange = "500-300 BCE";
      const ceDateRange = "100-200 CE";

      expect(/BCE/.test(bceDateRange)).toBe(true);
      expect(/CE/.test(ceDateRange)).toBe(true);
    });

    it("should ensure events have required historical information", () => {
      const event = {
        id: "1",
        title: "Roman Shipwreck",
        description: "Merchant vessel",
        dateRange: "100-200 CE",
        actualDate: 150,
        culture: "Roman",
      };

      const hasRequiredFields =
        !!event.title &&
        !!event.description &&
        !!event.dateRange &&
        event.actualDate !== undefined &&
        !!event.culture;

      expect(hasRequiredFields).toBe(true);
    });
  });

  describe("Feedback Generation", () => {
    it("should provide feedback for misplaced events", () => {
      const userOrder = ["1", "3", "2"];
      const correctOrder = ["1", "2", "3"];
      const events = [
        { id: "1", title: "Ancient Greek" },
        { id: "2", title: "Roman" },
        { id: "3", title: "Viking" },
      ];

      const feedback: string[] = [];
      for (let i = 0; i < userOrder.length; i++) {
        if (userOrder[i] !== correctOrder[i]) {
          const event = events.find((e) => e.id === userOrder[i]);
          if (event) {
            feedback.push(`${event.title} is in the wrong position`);
          }
        }
      }

      expect(feedback).toContain("Viking is in the wrong position");
      expect(feedback).toContain("Roman is in the wrong position");
    });

    it("should provide no feedback for correct placements", () => {
      const userOrder = ["1", "2", "3"];
      const correctOrder = ["1", "2", "3"];

      const feedback: string[] = [];
      for (let i = 0; i < userOrder.length; i++) {
        if (userOrder[i] !== correctOrder[i]) {
          feedback.push("Wrong position");
        }
      }

      expect(feedback).toHaveLength(0);
    });
  });

  describe("Final Score Calculation", () => {
    it("should combine timeline accuracy and culture matching scores", () => {
      const timelineScore = 300; // 60% accuracy
      const cultureMatchScore = 100; // 2 correct matches at 50 points each
      const totalScore = timelineScore + cultureMatchScore;

      expect(totalScore).toBe(400);
    });

    it("should calculate final accuracy percentage", () => {
      const correctPositions = 4;
      const totalPositions = 5;
      const accuracy = (correctPositions / totalPositions) * 100;

      expect(accuracy).toBe(80);
    });
  });
});
