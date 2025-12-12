# Conservation Lab Process Ordering Feature

## Overview

Added the ability to validate correct and incorrect ordering of cleaning processes in the Conservation Lab game. Students must now arrange conservation processes in the proper sequence to earn full points.

## Changes Made

### Backend (convex/conservationLabGame.ts)

1. **Enhanced `createTreatmentPlan` mutation**:
   - Now returns detailed ordering errors
   - Provides specific feedback about which processes are out of order
   - Awards 30 points for correct order, only 10 points for incorrect order

2. **New `validateProcessOrderDetailed` function**:
   - Validates that processes follow the correct sequence: Cleaning → Stabilization → Repair → Preservation
   - Returns detailed error messages for each out-of-order process
   - Explains why a process is incorrectly placed

3. **Scoring System**:
   - **Correct order**: 30 points (full credit)
   - **Incorrect order**: 10 points (reduced credit)
   - This creates a significant incentive to learn the proper sequence

### Frontend

#### Updated Components

1. **TreatmentPlanner.tsx**:
   - Added visual indicators for out-of-order processes
   - Processes that are incorrectly ordered show a red border and warning icon
   - Real-time feedback as students drag and drop processes

2. **conservation-lab/page.tsx**:
   - Enhanced feedback when creating treatment plan
   - Displays detailed ordering errors in an alert
   - Shows which specific processes are out of order and why

### Testing

Created comprehensive unit tests (`convex/__tests__/conservationLabOrdering.test.ts`) that verify:

- ✅ Correct process order is validated properly
- ✅ Incorrect order is detected
- ✅ Multiple ordering errors are caught
- ✅ Same-category processes can be in any order
- ✅ Categories can be skipped (e.g., cleaning → preservation)
- ✅ Edge cases (empty list, single process)

## Conservation Process Order

The correct sequence for conservation processes is:

1. **Cleaning** 🧹
   - Remove loose sediment and marine growth
   - Chemical baths
   - Mechanical cleaning
   - Ultrasonic cleaning
   - Biocide treatment

2. **Stabilization** 🔧
   - Consolidation
   - Desalination
   - Corrosion inhibitors
   - Freeze drying

3. **Repair** 🔨
   - Adhesive repair
   - Gap filling
   - Structural support

4. **Preservation** 🛡️
   - Protective coatings
   - Wax coating
   - Humidity control storage

## User Experience

### Before Creating Plan

- Students can drag and drop processes to arrange them
- Visual warnings appear for out-of-order processes (red border + ⚠️ icon)
- Helpful tip reminds students of the correct sequence

### After Creating Plan

- Alert shows score earned (10 or 30 points)
- If incorrect, detailed errors explain each mistake
- Example error message:

  ```
  Plan Score: 10/30 points

  Treatment plan created, but the order has issues.
  You earned 10 points instead of 30.

  ❌ Ordering Issues:

  1. Consolidation: Stabilization process should come
     before Repair processes. Conservation follows this
     order: Cleaning → Stabilization → Repair → Preservation.
  ```

### During Execution

- Students execute each step in the order they planned
- Visual progress shows artifact improving as treatment proceeds
- Completed steps are marked with checkmarks

## Educational Value

This feature teaches students:

1. **Proper conservation methodology** - Understanding why order matters
2. **Critical thinking** - Planning before executing
3. **Attention to detail** - Recognizing the correct sequence
4. **Real-world skills** - Following professional conservation protocols

## Technical Details

### Validation Logic

The system validates that each process category index is greater than or equal to the previous category index:

```typescript
categoryOrder = ["cleaning", "stabilization", "repair", "preservation"];

// Valid: cleaning (0) → stabilization (1) → repair (2) → preservation (3)
// Valid: cleaning (0) → preservation (3) [skipping is allowed]
// Invalid: repair (2) → stabilization (1) [going backwards]
```

### Scoring Impact

- Assessment: 20 points
- Process Selection: 40 points (10 per appropriate process)
- **Treatment Planning: 30 points** ← This is where ordering matters
- Treatment Execution: 40 points (10 per step)
- **Total: 130 points** (capped at 100, overflow becomes bonus)

The 20-point difference between correct (30) and incorrect (10) ordering makes this a significant learning opportunity.

## Future Enhancements

Potential improvements:

- Add hints that appear after first incorrect attempt
- Show example correct sequences for different artifact types
- Add a "practice mode" where students can experiment without penalty
- Include explanations of why each category must come in order
- Add animations showing consequences of incorrect ordering
