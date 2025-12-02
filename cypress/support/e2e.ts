// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent TypeScript errors
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to wait for page to be fully loaded
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Custom command to check if element is in viewport
       * @example cy.get('element').isInViewport()
       */
      isInViewport(): Chainable<boolean>;
    }
  }
}

// Disable uncaught exception handling for tests
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // This is useful for third-party scripts that might throw errors
  return false;
});
