# Implementation Plan

- [ ] 1. Fix the return validator in getExcavationGameState query
  - Update the return validator to accurately match the data structure being returned
  - Ensure environmentalConditions validator matches the parsed JSON object structure
  - Ensure siteArtifacts validator matches the parsed JSON array structure
  - Make optional fields properly optional (artifactId, notes in excavatedCells)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [ ] 2. Add error handling for edge cases
  - Add null checks before accessing nested properties
  - Ensure query returns null when session is not found
  - Ensure query returns null when excavation site is not found
  - Add try-catch blocks around JSON.parse operations if needed
  - _Requirements: 1.5, 3.2, 3.3, 3.5_

- [ ] 3. Verify the fix works end-to-end
  - Test that the excavation simulation page loads without errors
  - Verify game state is correctly retrieved and displayed
  - Test starting a new game session
  - Test that all game data is properly typed and accessible
  - _Requirements: 1.1, 2.3, 2.4_

- [ ] 4. Add validation tests for the query
  - Write unit tests for getExcavationGameState with valid session
  - Write unit tests for getExcavationGameState with invalid session
  - Write unit tests for getExcavationGameState with missing site
  - Test that return validator accepts valid data structures
  - _Requirements: 2.1, 2.2, 3.1, 3.4_
