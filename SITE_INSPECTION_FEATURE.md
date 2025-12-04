# Site Inspection Feature - Site Documentation Game

## Overview

Added an "Inspect" mode to the Site Documentation game that allows students to get contextual information about grid positions before taking photos or measurements.

## Changes Made

### 1. Backend (convex/siteDocumentationGame.ts)

- Added new query `inspectGridPosition` that returns detailed information about a specific grid cell
- Returns:
  - Description of what's at that location
  - Observable features (soil layers, artifacts, etc.)
  - Suggested measurement types
  - Suggested photo angles
  - List of artifacts present (if any)
- Uses grid position logic to create realistic site variation:
  - **Corners**: Clear stratigraphy, reference points
  - **Center**: High artifact density, structural remains
  - **Edges**: Profile walls, visible stratigraphy
  - **Mid-sections**: Mixed deposits, scattered artifacts

### 2. Frontend (src/components/games/SiteMapper.tsx)

- Added "Inspect Mode" as the default mode (alongside Photo and Measurement modes)
- Added `sessionId` prop to enable querying inspection data
- Displays inspection information in a formatted panel showing:
  - Site description
  - Observable features
  - Artifacts present (highlighted in special styling)
  - Suggested photo angles (as clickable tags)
  - Suggested measurements (as clickable tags)
- Quick action buttons to switch from Inspect to Photo or Measurement mode

### 3. Page Integration (src/app/challenges/site-documentation/page.tsx)

- Updated SiteMapper component usage to pass `sessionId` prop

## User Experience Flow

1. **Student selects a grid cell** → Automatically shows inspection information
2. **Student reads the context** → Understands what they're documenting
3. **Student clicks "Take Photo" or "Measure"** → Switches to appropriate mode with context
4. **Student documents with knowledge** → Makes informed decisions about angles, measurements, etc.

## Benefits

- **Educational**: Students learn what to look for before documenting
- **Realistic**: Mimics real archaeological practice of observation before documentation
- **Guided**: Provides suggestions without being prescriptive
- **Contextual**: Different grid positions have different characteristics
- **Engaging**: Makes the documentation process more interactive and meaningful

## Example Inspection Output

For a center grid position:

```
Description: "Central excavation area. High concentration of artifacts and features."

Features:
- Dense artifact scatter
- Possible structural remains
- Multiple soil contexts

Artifacts Present:
- Ancient pottery shard

Suggested Photo Angles:
- overhead
- 45-degree
- detail

Suggested Measurements:
- length
- width
- depth
```
