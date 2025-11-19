# Excavation Tool UX Improvements

## Problem

Users were confused about which tools to use and when. All tools (trowel, soft brush, measuring tape) were giving errors, making the game unplayable and frustrating.

## Root Causes

1. **Overly strict validation logic** - Tools were rejected because validation checked for exact string matches that didn't exist
2. **No visual feedback** - Users couldn't tell which tools would work on which cells
3. **No training** - Users didn't understand the archaeological workflow
4. **Poor error messages** - Native alerts were blocking and unhelpful

## Solutions Implemented

### 1. Fixed Tool Validation Logic (`convex/excavationGame.ts`)

**Before:**

```typescript
// Checked if "excavation" was in appropriateFor array
// But tools had specific uses like "precision_work", "grid_excavation"
const isAppropriate = tool.appropriateFor.some(
  (use: string) => actionType.includes(use) || use === "general"
);
```

**After:**

```typescript
// Define which tool TYPES are valid for excavation
const excavationTools = ["trowel", "brush", "probe"];
const documentationTools = ["camera", "measuring_tape"];

// Allow excavation tools on unexcavated cells
// Allow documentation tools only on excavated cells
```

**Result:** Trowel, brushes, and probe now work correctly for excavation!

### 2. Visual Hints in Grid (`src/components/games/ExcavationGrid.tsx`)

Added real-time visual feedback when hovering over cells:

- **Green ring** = Tool is appropriate for this cell ✅
- **Red ring** = Tool won't work here ❌
- **Green/red dot** = Additional indicator in corner

**Logic:**

- Documentation tools (camera, measuring tape) → Only work on excavated cells
- Excavation tools (trowel, brush, probe) → Work on unexcavated cells
- Sieve → Only works on excavated sediment

### 3. Interactive Tutorial (`src/components/games/ExcavationTutorial.tsx`)

Created a 7-step tutorial that teaches:

**Step 1:** Welcome and golden rule
**Step 2:** Initial excavation tools (Trowel, Brush, Probe)
**Step 3:** Discovering artifacts
**Step 4:** Documentation tools (Camera, Measuring Tape)
**Step 5:** Complete workflow (4-step process)
**Step 6:** Visual hints guide
**Step 7:** Ready to excavate checklist

**Features:**

- Shows automatically on first game
- Can be reopened anytime via "📚 Tutorial" button
- Progress dots show current step
- Beautiful visual examples with color-coded tool cards

### 4. Improved Toast Notifications

Replaced blocking alerts with helpful toasts that:

- Don't interrupt gameplay
- Show specific tool recommendations
- Include contextual tips
- Have action buttons (e.g., "View Tool Guide")
- Auto-dismiss after 8 seconds

### 5. Tool Guide Reference (`src/components/games/ToolGuideModal.tsx`)

Quick reference showing all tools with:

- What each tool is best for
- What to avoid using each tool for
- Pro tips for archaeological work
- Color-coded by tool category

## The Excavation Workflow

Users now learn this clear workflow:

```
1. EXCAVATE (Blue cells)
   └─ Use: Trowel, Soft Brush, or Probe
   └─ Visual: Green ring on hover

2. DISCOVER (Yellow cells with "A")
   └─ Artifact appears when excavation reaches it
   └─ Stop excavating this cell

3. DOCUMENT (Excavated cells)
   └─ Use: Camera or Measuring Tape
   └─ Visual: Green ring on excavated cells only

4. RECORD (Documentation Panel)
   └─ Add notes about your findings
   └─ Complete required documentation
```

## Visual Feedback System

### Cell Colors

- **Blue** = Unexcavated (use excavation tools)
- **Tan/Amber** = Excavated (can use documentation tools)
- **Yellow** = Artifact found (document it!)

### Hover Indicators

- **Green ring** = "This tool will work here"
- **Red ring** = "Switch to a different tool"
- **Tool icon** = Shows current tool on hover
- **Green/red dot** = Quick status indicator

### Button Layout

```
[Complete Excavation] [📚 Tutorial] [🛠️ Tool Guide] [Exit Game]
```

## User Experience Flow

### First Time User

1. Starts game
2. Tutorial automatically opens
3. Learns 7-step workflow with visuals
4. Starts excavating with confidence
5. Sees green/red rings for guidance
6. Can reopen tutorial or tool guide anytime

### Returning User

1. Starts game (no tutorial)
2. Hovers over cells to see tool compatibility
3. Green ring = click away!
4. Red ring = switch tools
5. Can access tutorial/guide via buttons

## Technical Implementation

### Files Created

- `src/components/games/ExcavationTutorial.tsx` - 7-step interactive tutorial
- `src/components/ui/Toast.tsx` - Toast notification component
- `src/components/ui/ToastContainer.tsx` - Toast provider and context
- `src/lib/toolSuggestions.ts` - Intelligent tool suggestion system
- `src/components/games/ToolGuideModal.tsx` - Quick reference guide

### Files Modified

- `convex/excavationGame.ts` - Fixed validation logic
- `src/components/games/ExcavationGrid.tsx` - Added visual hints
- `src/app/challenges/excavation-simulation/page.tsx` - Integrated all features
- `tailwind.config.js` - Added slide-in animation

### Key Functions

**`isToolAppropriate(x, y)`** - Determines if current tool works on a cell

```typescript
// Documentation tools only on excavated cells
if (toolType === "camera" || toolType === "measuring_tape") {
  return cell?.excavated === true;
}

// Excavation tools on unexcavated cells
if (toolType === "trowel" || toolType === "brush" || toolType === "probe") {
  return !cell?.excavated || (cell?.excavationDepth ?? 0) < 1;
}
```

**`validateToolUsage()`** - Backend validation with helpful messages

```typescript
// Define tool categories
const excavationTools = ["trowel", "brush", "probe"];
const documentationTools = ["camera", "measuring_tape"];

// Provide specific guidance
if (documentationTools.includes(tool.type)) {
  return {
    isValid: false,
    reason: "Use Archaeological Trowel or Soft Brush to excavate this cell.",
  };
}
```

## Results

### Before

- ❌ All tools gave errors
- ❌ No visual feedback
- ❌ Blocking alert dialogs
- ❌ No training or guidance
- ❌ Frustrating user experience

### After

- ✅ Excavation tools work correctly
- ✅ Green/red rings show tool compatibility
- ✅ Non-blocking toast notifications
- ✅ Interactive 7-step tutorial
- ✅ Always-available tool guide
- ✅ Clear visual workflow
- ✅ Educational and fun experience

## Future Enhancements

Potential improvements:

- [ ] Highlight recommended cells for current tool
- [ ] Add tool switching shortcuts (keyboard)
- [ ] Show "next recommended action" hint
- [ ] Add achievement for perfect tool usage
- [ ] Create practice mode with guided steps
- [ ] Add tooltips on tool selector
- [ ] Show excavation progress percentage per cell
- [ ] Add undo last action feature
