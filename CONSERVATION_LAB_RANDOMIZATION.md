# Conservation Lab Randomization Update

## Overview

Updated the Conservation Lab game to generate different artifacts and conditions every time a game is started, providing variety and replayability.

## Changes Made

### 1. Dynamic Artifact Condition Generation (`generateArtifactCondition`)

**Material Types** - Now randomly selects from 8 different material types:

- Ceramic with metal fittings
- Bronze with decorative elements
- Iron with wooden handle remnants
- Stone with carved details
- Glass with metal frame
- Composite ceramic and stone
- Copper alloy with inlay
- Terracotta with painted surface

**Damage Generation** - Randomized based on difficulty:

- **Beginner**: 2-3 damages (50% minor, 40% moderate, 10% severe)
- **Intermediate**: 3-4 damages (30% minor, 50% moderate, 20% severe)
- **Advanced**: 4-5 damages (20% minor, 40% moderate, 40% severe)

**Damage Types** - 5 types with multiple location and description variations:

- Encrustation (4 variations)
- Corrosion (4 variations)
- Fracture (4 variations)
- Biological (4 variations)
- Deterioration (4 variations)

**Environmental Factors** - Randomly selects 3-5 from 10 options:

- Saltwater exposure, marine organisms, sediment burial, tidal action, anaerobic conditions, shifting currents, temperature fluctuations, pressure, chemical reactions, biological activity

**Age Estimates** - Randomly selects from 6 ranges:

- 500-1000 years through 3000-4000 years

**Overall Condition** - Dynamically determined based on damage severity distribution

### 2. Dynamic Process Selection (`getAvailableProcesses`)

**Intelligent Process Generation** - Processes are now context-aware based on:

- Material type (ceramic, metal, stone, organic)
- Damage types present
- Overall condition severity

**Process Categories** with 16 different processes:

**Cleaning** (5 options):

- Gentle Cleaning (always appropriate)
- Chemical Bath (ceramic/stone)
- Mechanical Cleaning (metal/stone with encrustation)
- Ultrasonic Cleaning (metal without fractures)
- Biocide Treatment (biological damage)

**Stabilization** (4 options):

- Consolidation (deterioration/poor condition)
- Desalination (ceramic/organic)
- Corrosion Inhibitor (metal with corrosion)
- Freeze Drying (organic materials)

**Repair** (3 options):

- Adhesive Repair (fractures)
- Gap Filling (fractures/deterioration)
- Structural Support (severe fractures)

**Preservation** (3 options):

- Protective Coating (always appropriate)
- Wax Coating (metal)
- Humidity Control Storage (organic/metal)

**Randomization** - Each game presents 8-12 randomly selected processes from the available pool

## Educational Benefits

1. **Replayability**: Students can play multiple times with different scenarios
2. **Critical Thinking**: Must assess each unique artifact's specific needs
3. **Real-world Variety**: Mirrors the diversity of actual underwater archaeology
4. **Adaptive Learning**: Different difficulty levels provide appropriate challenges
5. **Context-Aware Decisions**: Teaches that conservation approaches depend on material and condition

## Technical Implementation

- All randomization happens server-side in `generateArtifactCondition()`
- Process appropriateness is dynamically calculated based on artifact properties
- No client-side changes required
- Maintains backward compatibility with existing game flow
- Scoring and validation logic unchanged
