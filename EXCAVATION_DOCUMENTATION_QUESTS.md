# Excavation Simulation Documentation Quests

## Overview

Added a quest system to the Excavation Simulation game that guides students through proper archaeological documentation practices. Students now have clear objectives to complete while excavating, making the learning experience more structured and rewarding.

## Features Added

### 1. Documentation Quests

Students receive documentation quests based on difficulty level:

**Beginner:**

- Take 3 photos
- Record 4 measurements
- Document 50% of discovered artifacts

**Intermediate:**

- Take 5 photos
- Record 6 measurements
- Document 50% of discovered artifacts
- Write 3 field notes

**Advanced:**

- Take 8 photos
- Record 10 measurements
- Document 50% of discovered artifacts
- Write 5 field notes
- Complete 50% grid survey

### 2. Quest Tracking

- Real-time progress tracking for each quest
- Visual progress bars showing completion status
- Bonus points awarded when quests are completed
- Quest completion notifications with rewards

### 3. UI Enhancements

**New "Quests" Tab in Documentation Panel:**

- Shows all active and completed quests
- Displays progress for each quest
- Provides hints on how to complete each quest
- Visual indicators for completed quests (✅)

### 4. Quest Types

1. **Site Photography** - Take photos using the Camera tool
2. **Record Measurements** - Use Measuring Tape to record dimensions
3. **Document Artifacts** - Create discovery entries for found artifacts
4. **Complete Grid Survey** - Systematically excavate the grid
5. **Field Notes** - Write observational notes about the excavation

## Technical Implementation

### Backend (Convex)

**New Validators:**

- `documentationQuestValidator` - Defines quest structure

**Updated Functions:**

- `startExcavationGame` - Initializes quests based on difficulty
- `addDocumentationEntry` - Tracks quest progress and awards bonuses
- `processExcavationAction` - Updates grid survey quest progress

**New Helper:**

- `initializeDocumentationQuests()` - Creates appropriate quests for difficulty level

### Frontend (React)

**Updated Components:**

- `DocumentationPanel` - Added quests tab with progress visualization
- `ExcavationSimulationPage` - Handles quest completion notifications

**New Types:**

- `DocumentationQuest` interface in `src/types/index.ts`

## Student Experience

1. **Start Game** - Quests are automatically assigned based on difficulty
2. **View Quests** - Check the "Quests" tab to see objectives
3. **Complete Tasks** - Add documentation entries to progress quests
4. **Earn Rewards** - Receive bonus points when quests are completed
5. **Get Feedback** - See completion notifications and progress updates

## Benefits

- **Structured Learning** - Clear objectives guide students through proper documentation
- **Motivation** - Quest completion provides sense of achievement
- **Skill Development** - Ensures students practice all documentation types
- **Progressive Difficulty** - More challenging quests for advanced students
- **Immediate Feedback** - Real-time progress tracking and notifications

## Future Enhancements

Possible additions:

- Daily/weekly quest rotation
- Special challenge quests with higher rewards
- Quest chains that unlock sequentially
- Leaderboards for quest completion
- Achievement badges for completing all quests in a difficulty level
