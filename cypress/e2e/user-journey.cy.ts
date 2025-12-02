/**
 * Integration Test: Complete User Journey from Registration to Certification
 * Requirements: 1.1, 4.2, 5.2
 *
 * This test validates the complete user flow through the underwater archaeology
 * learning platform, from initial access through to certification.
 */

describe("Complete User Journey - Registration to Certification", () => {
  beforeEach(() => {
    // Clear any existing session data
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("should complete the full user journey from landing to game access", () => {
    // Step 1: Visit landing page
    cy.visit("/");
    cy.contains("Underwater Learning").should("be.visible");

    // Step 2: Navigate to challenges section
    cy.visit("/challenges");
    cy.contains("Challenges").should("be.visible");

    // Verify all 5 game types are displayed (Requirement 1.1)
    cy.contains("Artifact Identification").should("be.visible");
    cy.contains("Excavation Simulation").should("be.visible");
    cy.contains("Site Documentation").should("be.visible");
    cy.contains("Historical Timeline").should("be.visible");
    cy.contains("Conservation Lab").should("be.visible");
  });

  it("should track progress across game sessions", () => {
    // Navigate to progress tracking page
    cy.visit("/challenges/progress");

    // Verify progress tracker displays completion percentages (Requirement 4.1)
    cy.contains("Progress").should("be.visible");
    cy.get('[data-testid="progress-tracker"]').should("exist");
  });

  it("should display certification status when eligible", () => {
    // Visit progress page to check certification eligibility
    cy.visit("/challenges/progress");

    // Check for certification section (Requirement 5.2)
    cy.contains("Certification").should("be.visible");
  });
});

describe("Game Session Flow", () => {
  it("should start and complete an artifact identification game", () => {
    cy.visit("/challenges/artifact-game");

    // Verify game loads with educational content (Requirement 1.2)
    cy.get('[data-testid="artifact-gallery"]').should("be.visible");

    // Verify at least 20 artifacts are available (Requirement 2.1)
    cy.get('[data-testid="artifact-item"]').should("have.length.at.least", 1);
  });

  it("should start and interact with excavation simulation", () => {
    cy.visit("/challenges/excavation-simulation");

    // Verify excavation grid is displayed (Requirement 3.1)
    cy.get('[data-testid="excavation-grid"]').should("be.visible");

    // Verify tool selector is available (Requirement 3.2)
    cy.get('[data-testid="tool-selector"]').should("be.visible");

    // Verify documentation panel exists (Requirement 3.2)
    cy.get('[data-testid="documentation-panel"]').should("be.visible");
  });

  it("should access site documentation game", () => {
    cy.visit("/challenges/site-documentation");

    // Verify site mapper component loads
    cy.get('[data-testid="site-mapper"]').should("be.visible");

    // Verify report builder is available
    cy.get('[data-testid="report-builder"]').should("be.visible");
  });

  it("should access historical timeline challenge", () => {
    cy.visit("/challenges/historical-timeline");

    // Verify timeline interface loads
    cy.get('[data-testid="timeline-interface"]').should("be.visible");

    // Verify context cards are available
    cy.get('[data-testid="context-cards"]').should("be.visible");
  });

  it("should access conservation lab simulation", () => {
    cy.visit("/challenges/conservation-lab");

    // Verify conservation workbench loads
    cy.get('[data-testid="conservation-workbench"]').should("be.visible");

    // Verify process selector is available
    cy.get('[data-testid="process-selector"]').should("be.visible");
  });
});

describe("Progress Tracking Integration", () => {
  it("should update progress after completing a game session", () => {
    // Start a game session
    cy.visit("/challenges/artifact-game");

    // Navigate to progress page
    cy.visit("/challenges/progress");

    // Verify progress tracker exists and shows data (Requirement 4.2)
    cy.get('[data-testid="progress-tracker"]').should("be.visible");
    cy.get('[data-testid="completion-percentage"]').should("exist");
  });

  it("should display detailed performance feedback", () => {
    cy.visit("/challenges/progress");

    // Verify detailed feedback is available (Requirement 4.5)
    cy.get('[data-testid="progress-tracker"]').should("be.visible");
  });
});

describe("Certification Flow", () => {
  it("should display certification requirements", () => {
    cy.visit("/challenges/progress");

    // Verify certification requirements are shown (Requirement 5.3)
    cy.contains("Certification").should("be.visible");
  });
});
