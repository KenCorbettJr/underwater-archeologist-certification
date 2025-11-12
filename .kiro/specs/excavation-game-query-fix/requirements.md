# Requirements Document

## Introduction

The excavation simulation game is experiencing a server error when users attempt to load the game state. The error occurs in the `getExcavationGameState` query in `convex/excavationGame.ts`. The issue is caused by a mismatch between the return validator and the actual data structure being returned, specifically with how `environmentalConditions` and `siteArtifacts` are parsed from JSON strings stored in the database.

## Glossary

- **Convex Query**: A read-only database operation that retrieves data from the Convex backend
- **Return Validator**: A Convex validation schema that defines the expected structure of data returned from a query
- **Game State**: The current state of an excavation simulation game session, including the session data, site information, and game-specific data
- **Environmental Conditions**: JSON data describing the underwater conditions at an excavation site (visibility, current strength, temperature, etc.)
- **Site Artifacts**: JSON array describing artifacts positioned within an excavation site grid

## Requirements

### Requirement 1

**User Story:** As a student user, I want to start and play the excavation simulation game, so that I can learn proper archaeological excavation techniques

#### Acceptance Criteria

1. WHEN a user navigates to the excavation simulation page, THE System SHALL load the game state without server errors
2. WHEN the game state is retrieved, THE System SHALL correctly parse and validate all environmental conditions data
3. WHEN the game state is retrieved, THE System SHALL correctly parse and validate all site artifacts data
4. THE System SHALL return game state data that matches the defined return validator structure
5. THE System SHALL handle cases where game sessions or excavation sites do not exist by returning null

### Requirement 2

**User Story:** As a developer, I want the query return validators to match the actual data structure, so that the application functions correctly and type safety is maintained

#### Acceptance Criteria

1. THE System SHALL define return validators that accurately reflect the data structure returned by queries
2. THE System SHALL ensure all parsed JSON data conforms to the expected validator schema
3. THE System SHALL maintain type safety between the database schema, query logic, and return validators
4. THE System SHALL handle optional fields appropriately in the return validator
5. THE System SHALL validate that all required fields are present in the returned data

### Requirement 3

**User Story:** As a system administrator, I want clear error messages when data validation fails, so that I can quickly diagnose and fix issues

#### Acceptance Criteria

1. WHEN data validation fails, THE System SHALL provide descriptive error messages indicating which field failed validation
2. WHEN a game session is not found, THE System SHALL return null rather than throwing an error
3. WHEN an excavation site is not found, THE System SHALL return null rather than throwing an error
4. THE System SHALL log validation errors with sufficient context for debugging
5. THE System SHALL handle edge cases gracefully without crashing the application
