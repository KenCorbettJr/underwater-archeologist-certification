/// <reference types="cypress" />

/**
 * Custom Cypress commands for integration testing
 */

/**
 * Wait for page to be fully loaded
 */
Cypress.Commands.add("waitForPageLoad", () => {
  cy.window().should("have.property", "document");
  cy.document().should("have.property", "readyState", "complete");
});

/**
 * Check if element is in viewport
 */
Cypress.Commands.add("isInViewport", { prevSubject: true }, (subject) => {
  const rect = subject[0].getBoundingClientRect();

  const isInViewport =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= Cypress.config("viewportHeight") &&
    rect.right <= Cypress.config("viewportWidth");

  return cy.wrap(isInViewport);
});

// Export for TypeScript
export {};
