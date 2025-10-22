"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Target, Clock, TrendingUp, Star, Award } from "lucide-react";

interface ScoreData {
  currentScore: number;
  maxScore: number;
  accuracy: number; // percentage
  timeSpent: number; // in seconds
  streak: number;
  level: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface ScoreTrackerProps {
  scoreData: ScoreData;
  showAnimations?: boolean;
  showDetailedStats?: boolean;
  className?: string;
}

export function ScoreTracker({
  scoreData,
  showAnimations = true,
  showDetailedStats = true,
  className = "",
}: ScoreTrackerProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);
  const [showScoreIncrease, setShowScoreIncrease] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);

  // Animate score changes
  useEffect(() => {
    if (showAnimations) {
      const scoreDiff = scoreData.currentScore - previousScore;
      if (scoreDiff > 0) {
        setShowScoreIncrease(true);
        setTimeout(() => setShowScoreIncrease(false), 1000);
      }
      setPreviousScore(scoreData.currentScore);

      // Animate score counting
      const scoreAnimation = setInterval(() => {
        setAnimatedScore((prev) => {
          if (prev < scoreData.currentScore) {
            return Math.min(
              prev + Math.ceil((scoreData.currentScore - prev) / 10),
              scoreData.currentScore
            );
          }
          return scoreData.currentScore;
        });
      }, 50);

      // Animate accuracy counting
      const accuracyAnimation = setInterval(() => {
        setAnimatedAccuracy((prev) => {
          if (prev < scoreData.accuracy) {
            return Math.min(
              prev + Math.ceil((scoreData.accuracy - prev) / 10),
              scoreData.accuracy
            );
          }
          return scoreData.accuracy;
        });
      }, 50);

      return () => {
        clearInterval(scoreAnimation);
        clearInterval(accuracyAnimation);
      };
    } else {
      setAnimatedScore(scoreData.currentScore);
      setAnimatedAccuracy(scoreData.accuracy);
    }
  }, [
    scoreData.currentScore,
    scoreData.accuracy,
    showAnimations,
    previousScore,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-600";
    if (accuracy >= 75) return "text-yellow-600";
    if (accuracy >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 90) return "bg-green-100 border-green-200";
    if (accuracy >= 75) return "bg-yellow-100 border-yellow-200";
    if (accuracy >= 60) return "bg-orange-100 border-orange-200";
    return "bg-red-100 border-red-200";
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 10) return <Award className="w-5 h-5 text-purple-600" />;
    if (streak >= 5) return <Star className="w-5 h-5 text-yellow-600" />;
    if (streak >= 3) return <TrendingUp className="w-5 h-5 text-blue-600" />;
    return <Target className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className={`score-tracker ${className}`}>
      {/* Main Score Display */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Score Tracker
          </h3>
          <div className="text-sm text-gray-600">Level {scoreData.level}</div>
        </div>

        {/* Score and Progress */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Current Score */}
          <div className="text-center relative">
            <div className="text-2xl font-bold text-blue-600 relative">
              {animatedScore}
              {showScoreIncrease && (
                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-green-600 text-sm font-medium animate-bounce">
                  +{scoreData.currentScore - previousScore}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">Current Score</div>
            <div className="text-xs text-gray-400">/ {scoreData.maxScore}</div>
          </div>

          {/* Accuracy */}
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getAccuracyColor(animatedAccuracy)}`}
            >
              {Math.round(animatedAccuracy)}%
            </div>
            <div className="text-xs text-gray-500">Accuracy</div>
            <div className="text-xs text-gray-400">
              {scoreData.correctAnswers}/{scoreData.totalQuestions}
            </div>
          </div>

          {/* Time Spent */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 font-mono">
              {formatTime(scoreData.timeSpent)}
            </div>
            <div className="text-xs text-gray-500">Time Spent</div>
          </div>

          {/* Streak */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {getStreakIcon(scoreData.streak)}
              <span className="text-2xl font-bold text-orange-600">
                {scoreData.streak}
              </span>
            </div>
            <div className="text-xs text-gray-500">Streak</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>
              {Math.round((scoreData.currentScore / scoreData.maxScore) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min((scoreData.currentScore / scoreData.maxScore) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      {showDetailedStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Performance Metrics */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Performance
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Questions Answered
                </span>
                <span className="font-medium">{scoreData.totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Correct Answers</span>
                <span className="font-medium text-green-600">
                  {scoreData.correctAnswers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Average Time per Question
                </span>
                <span className="font-medium font-mono">
                  {scoreData.totalQuestions > 0
                    ? formatTime(
                        Math.round(
                          scoreData.timeSpent / scoreData.totalQuestions
                        )
                      )
                    : "0:00"}
                </span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-600" />
              Achievements
            </h4>
            <div className="space-y-2">
              {scoreData.accuracy >= 90 && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Expert Accuracy (90%+)</span>
                </div>
              )}
              {scoreData.streak >= 5 && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">Hot Streak (5+ correct)</span>
                </div>
              )}
              {scoreData.streak >= 10 && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">
                    Master Streak (10+ correct)
                  </span>
                </div>
              )}
              {scoreData.totalQuestions >= 20 && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">
                    Dedicated Learner (20+ questions)
                  </span>
                </div>
              )}
              {scoreData.accuracy < 50 && scoreData.totalQuestions === 0 && (
                <div className="text-sm text-gray-500 italic">
                  Complete questions to unlock achievements
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Feedback */}
      <div
        className={`
        mt-4 p-3 rounded-lg border transition-all duration-300
        ${getAccuracyBgColor(scoreData.accuracy)}
      `}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            {scoreData.accuracy >= 90
              ? "Excellent work! Keep it up!"
              : scoreData.accuracy >= 75
                ? "Great progress! You're doing well!"
                : scoreData.accuracy >= 60
                  ? "Good effort! Keep practicing!"
                  : scoreData.totalQuestions > 0
                    ? "Don't give up! Learning takes time!"
                    : "Ready to start your archaeological journey?"}
          </span>
        </div>
      </div>
    </div>
  );
}
