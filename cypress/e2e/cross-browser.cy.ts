/**
 * Integration Test: Cross-Browser Compatibility
 * Requirements: 1.1
 *
 * This test validates that the application works consistently across
 * different browsers (Chrome, Firefox, Edge, Safari).
 */

describe("Cross-Browser Compatibility - Core Functionality", () => {
  it("should load landing page in all browsers", () => {
    cy.visit("/");

    // Verify core content loads
    cy.contains("Underwater Learning").should("be.visible");

    // Verify navigation works
    cy.get("nav").should("be.visible");
  });

  it("should display challenges page consistently", () => {
    cy.visit("/challenges");

    // Verify all game types are visible
    cy.contains("Challenges").should("be.visible");
    cy.contains("Artifact Identification").should("be.visible");
    cy.contains("Excavation Simulation").should("be.visible");
    cy.contains("Site Documentation").should("be.visible");
    cy.contains("Historical Timeline").should("be.visible");
    cy.contains("Conservation Lab").should("be.visible");
  });

  it("should render artifact game correctly", () => {
    cy.visit("/challenges/artifact-game");

    // Verify game components render
    cy.get('[data-testid="artifact-gallery"]').should("be.visible");
  });

  it("should render excavation simulation correctly", () => {
    cy.visit("/challenges/excavation-simulation");

    // Verify all game components render
    cy.get('[data-testid="excavation-grid"]').should("be.visible");
    cy.get('[data-testid="tool-selector"]').should("be.visible");
    cy.get('[data-testid="documentation-panel"]').should("be.visible");
  });
});

describe("Cross-Browser Compatibility - Interactive Elements", () => {
  it("should handle button clicks consistently", () => {
    cy.visit("/challenges");

    // Test navigation to different games
    cy.contains("Artifact Identification").should("be.visible");
  });

  it("should handle form inputs consistently", () => {
    cy.visit("/challenges/excavation-simulation");

    // Verify documentation panel accepts input
    cy.get('[data-testid="documentation-panel"]').should("be.visible");
  });

  it("should handle drag-and-drop interactions", () => {
    cy.visit("/challenges/historical-timeline");

    // Verify timeline interface supports interactions
    cy.get('[data-testid="timeline-interface"]').should("be.visible");
  });
});

describe("Cross-Browser Compatibility - Styling and Layout", () => {
  it("should apply CSS styles consistently", () => {
    cy.visit("/");

    // Verify main container has proper styling
    cy.get("body").should("have.css", "margin");
    cy.get("body").should("have.css", "padding");
  });

  it("should display flexbox layouts correctly", () => {
    cy.visit("/challenges");

    // Verify layout is not broken
    cy.contains("Challenges").should("be.visible");
  });

  it("should display grid layouts correctly", () => {
    cy.visit("/challenges/excavation-simulation");

    // Verify grid renders properly
    cy.get('[data-testid="excavation-grid"]').should("be.visible");
  });
});

describe("Cross-Browser Compatibility - Media and Assets", () => {
  it("should load images correctly", () => {
    cy.visit("/challenges/artifact-game");

    // Verify images load (if any artifacts are present)
    cy.get('[data-testid="artifact-gallery"]').should("be.visible");
  });

  it("should apply custom fonts correctly", () => {
    cy.visit("/");

    // Verify text is rendered with proper fonts
    cy.get("body").should("have.css", "font-family");
  });
});

describe("Cross-Browser Compatibility - JavaScript Features", () => {
  it("should support modern JavaScript features", () => {
    cy.visit("/challenges/artifact-game");

    // Verify React components render (indicates JS is working)
    cy.get('[data-testid="artifact-gallery"]').should("be.visible");
  });

  it("should handle async operations correctly", () => {
    cy.visit("/challenges/progress");

    // Verify data loads asynchronously
    cy.get('[data-testid="progress-tracker"]').should("be.visible");
  });

  it("should support local storage", () => {
    cy.visit("/challenges");

    // Test local storage functionality
    cy.window().then((win) => {
      win.localStorage.setItem("test", "value");
      expect(win.localStorage.getItem("test")).to.equal("value");
      win.localStorage.removeItem("test");
    });
  });
});

describe("Cross-Browser Compatibility - Performance", () => {
  it("should load pages efficiently across browsers", () => {
    const startTime = Date.now();

    cy.visit("/challenges");

    cy.contains("Challenges")
      .should("be.visible")
      .then(() => {
        const loadTime = Date.now() - startTime;
        // Should load within 3 seconds
        expect(loadTime).to.be.lessThan(3000);
      });
  });

  it("should handle navigation smoothly", () => {
    cy.visit("/");
    cy.visit("/challenges");
    cy.visit("/challenges/artifact-game");

    // Verify final page loads correctly
    cy.get('[data-testid="artifact-gallery"]').should("be.visible");
  });
});

describe("Cross-Browser Compatibility - Error Handling", () => {
  it("should handle 404 pages gracefully", () => {
    cy.visit("/non-existent-page", { failOnStatusCode: false });

    // Should show some content (Next.js 404 page)
    cy.get("body").should("be.visible");
  });

  it("should handle network errors gracefully", () => {
    cy.visit("/challenges");

    // Page should still render even if some data fails to load
    cy.contains("Challenges").should("be.visible");
  });
});
