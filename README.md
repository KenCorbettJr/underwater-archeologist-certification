# Underwater Learning

A Next.js application where middle schoolers can learn about underwater archeology and earn certification as junior underwater archeologists.

## Features

- 🏛️ Interactive learning modules about underwater archeology
- 🤿 Hands-on challenges and simulations
- 🏆 Progressive certification system (Beginner → Intermediate → Advanced → Certified)
- 🏺 Artifact discovery and identification games
- 📚 Educational content about historical underwater sites
- 👥 User progress tracking and achievements

## Tech Stack

- **Frontend**: Next.js 15.5.4 with React 19, TypeScript, Tailwind CSS 4
- **Backend**: Convex for real-time database and API
- **Authentication**: Clerk
- **UI Components**: Radix UI primitives
- **AI Integration**: Google AI (Genkit), FAL AI for image generation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your API keys and configuration.

4. Set up Convex:

   ```bash
   npx convex dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start Next.js + Convex dev servers
- `npm run emulate` - Run with local Convex emulator
- `npm run build` - Build Next.js application
- `npm run test` - Run unit tests
- `npm run cypress:open` - Open Cypress UI for E2E testing
- `npm run dashboard` - Open Convex dashboard
- `npm run deploy` - Deploy Convex backend

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── providers/          # React context providers
└── types/              # TypeScript type definitions

convex/
├── schema.ts           # Database schema
├── users.ts            # User management functions
├── challenges.ts       # Challenge and progress functions
└── _generated/         # Auto-generated Convex files
```

## Database Schema

- **users**: Student profiles with certification levels and progress
- **challenges**: Learning challenges organized by difficulty and category
- **userProgress**: Individual progress tracking for each challenge
- **artifacts**: Historical artifacts for discovery activities
- **lessons**: Educational content modules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
