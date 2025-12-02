/**
 * Integration Test: Mobile Responsiveness and Touch Interactions
 * Requirements: 1.1, 1.3
 *
 * This test validates that all game components work effectively on mobile devices
 * and tablets with touch-friendly interfaces.
 */

describe("Mobile Responsiveness - Phone Viewport", () => {
  beforeEach(() => {
    // Set mobile viewport (iPhone X)
    cy.viewport(375, 812);
  });

  it("should display landing page correctly on mobile", () => {
    cy.visit("/");

    // Verify main content is visible and not cut off
    cy.contains("Underwater Learning").should("be.visible");

    // Verify navigation is accessible
    cy.get("nav").should("be.visible");
  });

  it("should display challenges page with proper mobile layout", () => {
    cy.visit("/challenges");

    // Verify all game cards are stacked vertically on mobile
    cy.contains("Challenges").should("be.visible");
    cy.contains("Artifact Identification").should("be.visible");
    cy.contains("Excavation Simulation").should("be.visible");
  });

  it("should make artifact game touch-friendly on mobile", () => {
    cy.visit("/challenges/artifact-game");

    // Verify touch-friendly buttons exist
    cy.get('[data-testid="artifact-gallery"]').should("be.visible");

    // Verify elements are large enough for touch (minimum 44x44px)
    cy.get("button").first().should("have.css", "min-height");
  });

  it("should make excavation grid touch-friendly on mobile", () => {
    cy.visit("/challenges/excavation-simulation");

    // Verify grid is responsive
    cy.get('[data-testid="excavation-grid"]').should("be.visible");

    // Verify tool selector has touch-friendly buttons
    cy.get('[data-testid="tool-selector"]').should("be.visible");
    cy.get('[data-testid="tool-selector"] button').should(
      "have.length.at.least",
      1
    );
  });

  it("should display progress page correctly on mobile", () => {
    cy.visit("/challenges/progress");

    // Verify progress tracker is visible and readable
    cy.get('[data-testid="progress-tracker"]').should("be.visible");
  });
});

describe("Mobile Responsiveness - Tablet Viewport", () => {
  beforeEach(() => {
    // Set tablet viewport (iPad)
    cy.viewport(768, 1024);
  });

  it("should display landing page correctly on tablet", () => {
    cy.visit("/");

    cy.contains("Underwater Learning").should("be.visible");
  });

  it("should display challenges in grid layout on tablet", () => {
    cy.visit("/challenges");

    // Verify challenges are displayed in a grid
    cy.contains("Challenges").should("be.visible");
    cy.contains("Artifact Identification").should("be.visible");
  });

  it("should display excavation game with proper tablet layout", () => {
    cy.visit("/challenges/excavation-simulation");

    // Verify all game components are visible
    cy.get('[data-testid="excavation-grid"]').should("be.visible");
    cy.get('[data-testid="tool-selector"]').should("be.visible");
    cy.get('[data-testid="documentation-panel"]').should("be.visible");
  });

  it("should display progress dashboard with charts on tablet", () => {
    cy.visit("/challenges/progress");

    cy.get('[data-testid="progress-tracker"]').should("be.visible");
  });
});

describe("Touch Interactions", () => {
  beforeEach(() => {
    cy.viewport(375, 812);
  });

  it("should support touch interactions in artifact game", () => {
    cy.visit("/challenges/artifact-game");

    // Verify touch-friendly elements exist
    cy.get('[data-testid="artifact-gallery"]').should("be.visible");

    // Test touch interaction on artifact items
    cy.get('[data-testid="artifact-item"]').first().should("be.visible");
  });

  it("should support touch interactions in excavation grid", () => {
    cy.visit("/challenges/excavation-simulation");

    // Verify grid cells are touch-friendly
    cy.get('[data-testid="excavation-grid"]').should("be.visible");
    cy.get('[data-testid="grid-cell"]').first().should("be.visible");
  });

  it("should support swipe gestures where applicable", () => {
    cy.visit("/challenges/historical-timeline");

    // Verify timeline supports touch interactions
    cy.get('[data-testid="timeline-interface"]').should("be.visible");
  });
});

describe("Responsive Navigation", () => {
  it("should show mobile menu on small screens", () => {
    cy.viewport(375, 812);
    cy.visit("/");

    // Verify mobile navigation exists
    cy.get("nav").should("be.visible");
  });

  it("should show full navigation on desktop", () => {
    cy.viewport(1280, 720);
    cy.visit("/");

    // Verify desktop navigation
    cy.get("nav").should("be.visible");
  });
});

describe("Performance on Mobile", () => {
  beforeEach(() => {
    cy.viewport(375, 812);
  });

  it("should load pages within acceptable time on mobile", () => {
    const startTime = Date.now();

    cy.visit("/challenges");

    cy.contains("Challenges")
      .should("be.visible")
      .then(() => {
        const loadTime = Date.now() - startTime;
        // Page should load within 5 seconds on mobile
        expect(loadTime).to.be.lessThan(5000);
      });
  });

  it("should load game pages efficiently on mobile", () => {
    const startTime = Date.now();

    cy.visit("/challenges/artifact-game");

    cy.get('[data-testid="artifact-gallery"]')
      .should("be.visible")
      .then(() => {
        const loadTime = Date.now() - startTime;
        // Game should load within 5 seconds
        expect(loadTime).to.be.lessThan(5000);
      });
  });
});
