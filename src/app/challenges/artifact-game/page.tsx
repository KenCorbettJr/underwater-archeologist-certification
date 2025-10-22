"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArtifactGallery } from "@/components/games/ArtifactGallery";
import { IdentificationQuiz } from "@/components/games/IdentificationQuiz";
import { ScoreTracker } from "@/components/games/ScoreTracker";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Play, Trophy } from "lucide-react";
import { Artifact, DifficultyLevel } from "@/types";

type GameState = "setup" | "playing" | "completed";

interface QuizQuestion {
  artifact: Artifact;
  options: string[];
  correctAnswer: string;
  questionType: "period" | "culture" | "category";
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  answers: {
    questionIndex: number;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

export default function ArtifactGamePage() {
  const { user } = useUser();
  const [gameState, setGameState] = useState<GameState>("setup");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [gameResults, setGameResults] = useState<QuizResult | null>(null);

  // Fetch artifacts for the game
  const artifacts = useQuery(api.artifacts.getRandomArtifacts, {
    count: 10,
    difficulty,
  });

  // Create game session mutation
  const createGameSession = useMutation(
    api.artifactGame.createArtifactGameSession
  );
  const createUser = useMutation(api.users.createUser);
  const getCurrentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );

  const handleStartGame = async () => {
    if (!user || !artifacts || artifacts.length === 0) return;

    try {
      // Get or create the user in Convex database
      let convexUserId;
      if (getCurrentUser) {
        convexUserId = getCurrentUser._id;
      } else {
        // Create user if they don't exist
        convexUserId = await createUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          name: user.fullName || user.firstName || "Anonymous",
        });
      }

      // Create a game session
      const sessionId = await createGameSession({
        userId: convexUserId,
        difficulty,
        questionCount: 5,
        questionTypes: ["period", "culture", "category"],
        artifactIds: artifacts.map((a) => a._id),
      });

      // Convert database artifacts to Artifact type
      const convertedArtifacts: Artifact[] = artifacts.map((a) => ({
        id: a._id,
        name: a.name,
        description: a.description,
        historicalPeriod: a.historicalPeriod,
        culture: a.culture,
        dateRange: a.dateRange,
        significance: a.significance,
        imageUrl: a.imageUrl,
        category: a.category,
        difficulty: a.difficulty,
        discoveryLocation: a.discoveryLocation,
        modelUrl: a.modelUrl,
        conservationNotes: a.conservationNotes,
        isActive: a.isActive,
      }));

      // Generate quiz questions from artifacts
      const questions = generateQuizQuestions(convertedArtifacts, difficulty);
      setQuizQuestions(questions);
      setGameState("playing");
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const generateQuizQuestions = (
    artifacts: Artifact[],
    difficulty: DifficultyLevel
  ): QuizQuestion[] => {
    const questionTypes: ("period" | "culture" | "category")[] = [
      "period",
      "culture",
      "category",
    ];
    const questions: QuizQuestion[] = [];

    artifacts.forEach((artifact, index) => {
      const questionType = questionTypes[index % questionTypes.length];

      let correctAnswer: string;
      let allOptions: string[];

      switch (questionType) {
        case "period":
          correctAnswer = artifact.historicalPeriod;
          allOptions = [...new Set(artifacts.map((a) => a.historicalPeriod))];
          break;
        case "culture":
          correctAnswer = artifact.culture;
          allOptions = [...new Set(artifacts.map((a) => a.culture))];
          break;
        case "category":
          correctAnswer = artifact.category;
          allOptions = [...new Set(artifacts.map((a) => a.category))];
          break;
      }

      // Create options with correct answer and 3 random wrong answers
      const wrongOptions = allOptions.filter(
        (option) => option !== correctAnswer
      );
      const shuffledWrongOptions = wrongOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [correctAnswer, ...shuffledWrongOptions].sort(
        () => Math.random() - 0.5
      );

      questions.push({
        artifact,
        options,
        correctAnswer,
        questionType,
      });
    });

    return questions.slice(0, Math.min(5, artifacts.length)); // Limit to 5 questions
  };

  const handleQuizComplete = (results: QuizResult) => {
    setGameResults(results);
    setGameState("completed");
  };

  const handlePlayAgain = () => {
    setGameState("setup");
    setQuizQuestions([]);
    setGameResults(null);
    setSelectedArtifact(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen wave-bg flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Please sign in to play</h1>
          <p>
            You need to be signed in to access the artifact identification game.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wave-bg relative overflow-hidden font-poppins">
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center backdrop-blur-sm bg-white/5 border-b border-white/10">
        <Link
          href="/challenges"
          className="text-white font-bold text-xl md:text-2xl flex items-center gap-3 font-fredoka hover:text-sand-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏺</span>
            <span className="hidden sm:inline">Artifact Identification</span>
            <span className="sm:hidden">Artifacts</span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        {gameState === "setup" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 font-fredoka">
                Artifact{" "}
                <span className="bg-gradient-to-r from-sand-200 via-sand-400 to-sand-600 bg-clip-text text-transparent">
                  Identification
                </span>
              </h1>
              <p className="text-xl text-ocean-50 max-w-2xl mx-auto">
                🏺 Test your knowledge of underwater archaeological artifacts!
                Identify historical periods, cultures, and categories.
              </p>
            </div>

            {/* Difficulty Selection */}
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/30">
              <h2 className="text-2xl font-bold text-white mb-6 text-center font-fredoka">
                Choose Your Difficulty
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {(
                  ["beginner", "intermediate", "advanced"] as DifficultyLevel[]
                ).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      difficulty === level
                        ? "border-sand-400 bg-sand-400/20 text-white"
                        : "border-white/30 bg-white/10 text-ocean-100 hover:border-sand-300 hover:bg-white/20"
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {level === "beginner"
                        ? "🌊"
                        : level === "intermediate"
                          ? "🏊"
                          : "🤿"}
                    </div>
                    <h3 className="text-lg font-bold capitalize mb-2">
                      {level}
                    </h3>
                    <p className="text-sm opacity-80">
                      {level === "beginner" &&
                        "Perfect for newcomers to underwater archaeology"}
                      {level === "intermediate" &&
                        "For those with some archaeological knowledge"}
                      {level === "advanced" &&
                        "Challenge yourself with complex artifacts"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Artifact Preview */}
            {artifacts && artifacts.length > 0 && (
              <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/30">
                <h2 className="text-2xl font-bold text-white mb-6 text-center font-fredoka">
                  Preview Artifacts
                </h2>
                <ArtifactGallery
                  artifacts={artifacts.map((a) => ({
                    id: a._id,
                    name: a.name,
                    description: a.description,
                    historicalPeriod: a.historicalPeriod,
                    culture: a.culture,
                    dateRange: a.dateRange,
                    significance: a.significance,
                    imageUrl: a.imageUrl,
                    category: a.category,
                    difficulty: a.difficulty,
                    discoveryLocation: a.discoveryLocation,
                    modelUrl: a.modelUrl,
                    conservationNotes: a.conservationNotes,
                    isActive: a.isActive,
                  }))}
                  selectedArtifact={selectedArtifact}
                  onArtifactSelect={setSelectedArtifact}
                  className="text-white"
                />
              </div>
            )}

            {/* Start Game Button */}
            <div className="text-center">
              <Button
                onClick={handleStartGame}
                disabled={!artifacts || artifacts.length === 0}
                className="bg-sand-400 hover:bg-sand-500 text-sand-900 text-lg px-8 py-4 rounded-2xl font-bold"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Identification Challenge
              </Button>
              {(!artifacts || artifacts.length === 0) && (
                <p className="text-ocean-200 mt-2">Loading artifacts...</p>
              )}
            </div>
          </div>
        )}

        {gameState === "playing" && quizQuestions.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <IdentificationQuiz
              questions={quizQuestions}
              onQuizComplete={handleQuizComplete}
              timeLimit={300} // 5 minutes
              className="text-white"
            />
          </div>
        )}

        {gameState === "completed" && gameResults && (
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/30">
              <div className="text-6xl mb-4">
                {gameResults.score / gameResults.totalQuestions >= 0.8
                  ? "🏆"
                  : gameResults.score / gameResults.totalQuestions >= 0.6
                    ? "🥈"
                    : "🥉"}
              </div>

              <h1 className="text-4xl font-black text-white mb-4 font-fredoka">
                Challenge{" "}
                <span className="bg-gradient-to-r from-sand-200 via-sand-400 to-sand-600 bg-clip-text text-transparent">
                  Complete!
                </span>
              </h1>

              <ScoreTracker
                scoreData={{
                  currentScore: gameResults.score,
                  maxScore: gameResults.totalQuestions,
                  accuracy: Math.round(
                    (gameResults.score / gameResults.totalQuestions) * 100
                  ),
                  timeSpent: Math.floor(gameResults.timeSpent / 1000),
                  streak: 0,
                  level: 1,
                  totalQuestions: gameResults.totalQuestions,
                  correctAnswers: gameResults.score,
                }}
                className="mb-8"
              />

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-sand-300 mb-4">
                    Performance
                  </h3>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-ocean-100">Correct Answers:</span>
                      <span className="text-white font-bold">
                        {gameResults.score}/{gameResults.totalQuestions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ocean-100">Accuracy:</span>
                      <span className="text-white font-bold">
                        {Math.round(
                          (gameResults.score / gameResults.totalQuestions) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ocean-100">Time Spent:</span>
                      <span className="text-white font-bold">
                        {Math.floor(gameResults.timeSpent / 1000)}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-sand-300 mb-4">
                    Achievement
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {gameResults.score / gameResults.totalQuestions >= 0.8
                        ? "🏆"
                        : gameResults.score / gameResults.totalQuestions >= 0.6
                          ? "🥈"
                          : "🥉"}
                    </div>
                    <p className="text-white font-bold">
                      {gameResults.score / gameResults.totalQuestions >= 0.8
                        ? "Expert Archaeologist!"
                        : gameResults.score / gameResults.totalQuestions >= 0.6
                          ? "Skilled Identifier!"
                          : "Keep Learning!"}
                    </p>
                    <p className="text-ocean-200 text-sm mt-2">
                      {gameResults.score / gameResults.totalQuestions >= 0.8
                        ? "Outstanding knowledge of artifacts!"
                        : gameResults.score / gameResults.totalQuestions >= 0.6
                          ? "Good understanding of archaeology!"
                          : "Practice makes perfect!"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handlePlayAgain}
                  className="bg-sand-400 hover:bg-sand-500 text-sand-900 px-6 py-3 rounded-xl font-bold"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Link href="/challenges">
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl font-bold"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Back to Challenges
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
