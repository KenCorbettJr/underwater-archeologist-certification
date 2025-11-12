# Design Document

## Overview

The excavation game query error is caused by a mismatch between the return validator in `getExcavationGameState` and the actual data structure being returned. The query parses JSON strings from the database (`environmentalConditions` and `siteArtifacts`) but the return validator expects a specific nested object structure that doesn't match what's being returned.

The fix involves updating the return validator to accurately reflect the data structure, ensuring proper type safety while maintaining backward compatibility with existing game sessions.

## Architecture

### Current Flow

1. Frontend calls `getExcavationGameState` query with a `sessionId`
2. Query retrieves game session from database
3. Query parses `gameData` JSON string
4. Query retrieves excavation site using `siteId` from game data
5. Query parses `environmentalConditions` and `siteArtifacts` JSON strings
6. Query returns structured data **← ERROR OCCURS HERE**
7. Return validator rejects the data structure

### Proposed Flow

1. Frontend calls `getExcavationGameState` query with a `sessionId`
2. Query retrieves game session from database
3. Query parses `gameData` JSON string
4. Query retrieves excavation site using `siteId` from game data
5. Query parses `environmentalConditions` and `siteArtifacts` JSON strings
6. Query returns structured data with corrected validator
7. Return validator accepts the data structure ✓
8. Frontend receives properly typed game state

## Components and Interfaces

### Modified Query: `getExcavationGameState`

**Location:** `convex/excavationGame.ts`

**Changes Required:**

1. Update the return validator to match the actual data structure
2. Ensure `environmentalConditions` validator matches the parsed JSON structure
3. Ensure `siteArtifacts` validator matches the parsed JSON array structure
4. Handle optional fields properly (e.g., `artifactId`, `notes` in excavated cells)

**Return Type Structure:**

```typescript
v.union(
  v.object({
    session: {
      // Session fields from gameSessions table
      _id, userId, gameType, difficulty, status,
      startTime, endTime (optional), currentScore,
      maxScore, completionPercentage
    },
    site: {
      // Site fields from excavationSites table
      _id, name, location, historicalPeriod,
      description, gridWidth, gridHeight, difficulty,
      environmentalConditions: {
        // Parsed from JSON string
        visibility, currentStrength, temperature,
        depth, sedimentType, timeConstraints
      },
      siteArtifacts: [{
        // Parsed from JSON array
        artifactId, gridPosition: {x, y},
        depth, isDiscovered, condition
      }]
    },
    gameData: {
      // Parsed from gameData JSON string
      siteId, currentTool, discoveredArtifacts,
      excavatedCells, documentationEntries,
      timeRemaining, protocolViolations
    }
  }),
  v.null()  // When session or site not found
)
```

## Data Models

### Environmental Conditions Structure

```typescript
{
  visibility: number,          // 0-100 percentage
  currentStrength: number,     // 0-10 scale
  temperature: number,         // degrees Celsius
  depth: number,              // meters
  sedimentType: string,       // e.g., "sandy", "muddy"
  timeConstraints: number     // minutes available
}
```

### Site Artifact Structure

```typescript
{
  artifactId: Id<"gameArtifacts">,
  gridPosition: {
    x: number,
    y: number
  },
  depth: number,              // 0-1 normalized depth
  isDiscovered: boolean,
  condition: "excellent" | "good" | "fair" | "poor"
}
```

### Excavated Cell Structure

```typescript
{
  x: number,
  y: number,
  excavated: boolean,
  excavationDepth: number,    // 0-1 normalized depth
  containsArtifact: boolean,
  artifactId?: Id<"gameArtifacts">,  // Optional
  notes?: string                      // Optional
}
```

## Error Handling

### Validation Errors

- **Root Cause:** Return validator doesn't match actual data structure
- **Solution:** Update validator to match parsed JSON structure
- **Prevention:** Add type assertions and validation tests

### Missing Data Errors

- **Root Cause:** Game session or excavation site not found
- **Solution:** Return `null` instead of throwing errors
- **Prevention:** Check for null values before accessing properties

### JSON Parsing Errors

- **Root Cause:** Malformed JSON in database fields
- **Solution:** Add try-catch blocks around JSON.parse calls
- **Prevention:** Validate JSON structure before storing in database

## Testing Strategy

### Unit Tests

1. Test `getExcavationGameState` with valid session ID
2. Test `getExcavationGameState` with invalid session ID (should return null)
3. Test `getExcavationGameState` with session but missing site (should return null)
4. Test that return validator accepts valid data structure
5. Test that environmental conditions are correctly parsed
6. Test that site artifacts are correctly parsed
7. Test that optional fields in excavated cells are handled properly

### Integration Tests

1. Create a game session and verify state can be retrieved
2. Start excavation game and verify initial state
3. Perform excavation actions and verify state updates
4. Complete game and verify final state

### Manual Testing

1. Navigate to excavation simulation page
2. Select difficulty and site
3. Start game and verify no errors
4. Perform excavation actions
5. Verify game state displays correctly

## Implementation Notes

### Backward Compatibility

- Existing game sessions should continue to work
- Handle cases where old sessions might have slightly different data structures
- Use optional fields where appropriate to handle missing data

### Type Safety

- Ensure TypeScript types match Convex validators
- Use generated types from `_generated/dataModel`
- Avoid type assertions unless absolutely necessary

### Performance

- Query should remain efficient (single session lookup, single site lookup)
- JSON parsing is fast and shouldn't impact performance
- Consider caching if query is called frequently

## Migration Plan

1. Update return validator in `getExcavationGameState`
2. Test query with existing game sessions
3. Deploy changes to production
4. Monitor for any validation errors
5. If issues arise, add additional optional fields to validator
