# Documentation Tools Fix

## Problem

After discovering an artifact, users tried to use the Camera or Measuring Tape to document it, but received errors saying the tools weren't appropriate.

## Root Cause

The `processExcavationAction` function was hardcoded to always treat every action as "excavation", even when using documentation tools:

```typescript
// BEFORE - Always passed "excavation"
const toolValidation = validateToolUsage(
  tool,
  "excavation", // ❌ Hardcoded!
  conditions,
  artifactAtPosition?.condition
);
```

This meant documentation tools were being validated as if they were excavation tools, which always failed.

## Solution

### 1. Determine Action Type Based on Tool

```typescript
// Determine action type based on tool and cell state
const documentationTools = ["camera", "measuring_tape"];
const isDocumentationTool = documentationTools.includes(tool.type);
const actionType = isDocumentationTool ? "documentation" : "excavation";
```

### 2. Handle Documentation Actions Separately

```typescript
// Handle documentation tools differently
if (isDocumentationTool) {
  // Documentation tools don't excavate, they just record
  if (cell.excavated) {
    // Successfully used documentation tool
    score += 10; // Small bonus for proper documentation
    const timeUsed = 15; // Documentation is quick

    return {
      success: true,
      newGameData,
      discoveries: [`Documented cell at position (${gridX}, ${gridY})`],
      violations,
      score,
      timeUsed,
    };
  }
  // If not excavated, validation will catch it
}
```

### 3. Update Validation Function

```typescript
function validateToolUsage(
  tool: any,
  actionType: string,
  conditions: any,
  artifactCondition?: string,
  cellExcavated?: boolean // ✅ New parameter
) {
  // For documentation actions, check if cell is excavated
  if (actionType === "documentation") {
    if (!cellExcavated) {
      return {
        isValid: false,
        reason: `${tool.name} can only be used on excavated cells. Excavate this cell first with a Trowel or Brush.`,
      };
    }
    // Documentation tools are valid on excavated cells
  }

  // ... rest of validation
}
```

### 4. Improved User Feedback

```typescript
// Show different messages for documentation vs discoveries
if (isDocumentation) {
  showToast(
    `${result.discoveries.join(", ")}\n\n💡 Tip: Add detailed notes in the Documentation Panel!`,
    "info",
    {
      title: "📝 Documented",
      duration: 5000,
    }
  );
}
```

## How It Works Now

### Workflow

1. **Excavate** a cell with Trowel/Brush until it's tan/yellow (excavated)
2. **Switch** to Camera or Measuring Tape
3. **Hover** over the excavated cell - you'll see a **green ring** ✅
4. **Click** the cell - you'll see "📝 Documented" toast
5. **Add notes** in the Documentation Panel

### Visual Feedback

- **Green ring** on hover = Documentation tool works here
- **Red ring** on hover = Cell not excavated yet, use Trowel/Brush first
- **Blue cells** = Not excavated (documentation tools won't work)
- **Tan/Yellow cells** = Excavated (documentation tools work!)

### Validation Logic

```
Documentation Tool + Unexcavated Cell = ❌ Error
Documentation Tool + Excavated Cell = ✅ Success (+10 points)
Excavation Tool + Unexcavated Cell = ✅ Success (excavates)
Excavation Tool + Excavated Cell = ✅ Success (continues excavating)
```

## Benefits

1. **Documentation tools now work** on excavated cells
2. **Clear visual feedback** (green/red rings)
3. **Helpful prompts** to add notes in Documentation Panel
4. **Bonus points** for proper documentation (+10 per use)
5. **Quick action** (only 15 seconds vs 30+ for excavation)

## Testing Checklist

- [x] Excavate a cell with Trowel
- [x] Cell turns tan/yellow when excavated
- [x] Switch to Camera
- [x] Hover over excavated cell shows green ring
- [x] Click excavated cell shows "Documented" message
- [x] Hover over unexcavated cell shows red ring
- [x] Click unexcavated cell shows helpful error
- [x] Same behavior for Measuring Tape
- [x] Documentation Panel can be used to add notes

## Files Modified

- `convex/excavationGame.ts`
  - Added action type detection
  - Separated documentation tool handling
  - Updated validation function signature
- `src/app/challenges/excavation-simulation/page.tsx`
  - Improved toast messages for documentation
  - Added tip to use Documentation Panel
- `src/components/games/ExcavationTutorial.tsx`
  - Clarified documentation tool usage
  - Changed warning to positive instructions

## Result

Documentation tools now work exactly as expected! Users can:

1. Excavate cells
2. Document them with Camera/Measuring Tape
3. Add detailed notes
4. Get bonus points for proper archaeological practice

The visual hints (green/red rings) make it crystal clear when documentation tools will work.
