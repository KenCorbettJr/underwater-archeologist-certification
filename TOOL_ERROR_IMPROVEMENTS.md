# Tool Error Experience Improvements

## Overview

Replaced native browser `alert()` dialogs with a modern, user-friendly toast notification system that provides helpful guidance when users select inappropriate tools.

## What Changed

### 1. Toast Notification System

- **Created**: `src/components/ui/Toast.tsx` - Individual toast component with different types (success, error, warning, info)
- **Created**: `src/components/ui/ToastContainer.tsx` - Toast provider and context for managing multiple toasts
- **Features**:
  - Animated slide-in from right
  - Auto-dismiss with configurable duration
  - Support for action buttons
  - Color-coded by type (success=green, error=red, warning=amber, info=blue)
  - Stacks multiple notifications

### 2. Intelligent Tool Suggestions

- **Created**: `src/lib/toolSuggestions.ts` - Smart suggestion system that:
  - Analyzes the violation type and current tool
  - Considers environmental conditions (visibility, current strength)
  - Provides specific tool recommendations
  - Offers contextual tips for better gameplay

### 3. Tool Guide Modal

- **Created**: `src/components/games/ToolGuideModal.tsx` - Interactive reference guide showing:
  - All available tools with icons
  - What each tool is best for
  - What to avoid using each tool for
  - Pro tips for archaeological work
  - Opens automatically on first violation (with action button in toast)
  - Can be opened anytime via "Tool Guide" button

### 4. Improved Backend Messages

- **Updated**: `convex/excavationGame.ts` - Enhanced `validateToolUsage()` function to:
  - Provide specific tool suggestions in error messages
  - Include environmental condition values in messages
  - Give clear guidance on what to do instead

### 5. Updated UI

- **Updated**: `src/app/challenges/excavation-simulation/page.tsx`:
  - Replaced all `alert()` calls with toast notifications
  - Added "Tool Guide" button to game controls
  - Shows helpful tips and suggestions in violation messages
  - First violation includes "View Tool Guide" action button
  - Discovery notifications now use success toasts
  - Completion summary uses formatted toast with all stats

## User Experience Improvements

### Before

```
[Native Alert Dialog]
Protocol violation: Hard Brush is not appropriate for excavation.
Consider using a different tool.
[OK Button]
```

### After

```
[Animated Toast - Warning Color]
🛠️ Hard Brush Not Suitable

The artifact is fragile and needs gentle handling.
Try using: Soft Brush or Archaeological Trowel.

💡 Tips:
• Use a Soft Brush for delicate cleaning
• A Trowel provides precision for careful extraction
• Hard brushes can damage fragile artifacts

[View Tool Guide] [×]
```

## Benefits

1. **Non-blocking**: Toasts don't interrupt gameplay flow
2. **Informative**: Specific guidance on which tools to use
3. **Educational**: Tips help users learn proper techniques
4. **Accessible**: Clear visual hierarchy and action buttons
5. **Professional**: Modern UI that matches the app's design
6. **Discoverable**: Tool guide available anytime via button
7. **Contextual**: Suggestions adapt to environmental conditions

## Technical Details

### Toast Types

- `success`: Green - for discoveries and completions
- `error`: Red - for critical errors
- `warning`: Amber - for protocol violations
- `info`: Blue - for general information

### Animation

Added `slide-in-right` animation to Tailwind config for smooth toast entrance.

### State Management

- Toast state managed via React Context
- Multiple toasts can be displayed simultaneously
- Auto-dismiss with configurable duration
- Manual dismiss via close button

## Future Enhancements

Potential improvements:

- Add sound effects for different notification types
- Persist "has seen violation" state across sessions
- Add more detailed artifact condition data to suggestions
- Create achievement for using correct tools
- Add tutorial mode that guides tool selection
