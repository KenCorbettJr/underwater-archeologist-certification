"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Artifact } from "@/types";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Target } from "lucide-react";

interface QuizQuestion {
  artifact: Artifact;
  options: string[];
  correctAnswer: string;
  questionType: "period" | "culture" | "category";
}

interface IdentificationQuizProps {
  questions: QuizQuestion[];
  onQuizComplete: (results: QuizResult) => void;
  timeLimit?: number; // in seconds
  className?: string;
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

interface DragItem {
  id: string;
  content: string;
  type: "artifact" | "answer";
}

export function IdentificationQuiz({
  questions,
  onQuizComplete,
  timeLimit = 300, // 5 minutes default
  className = "",
}: IdentificationQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizResult["answers"]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [quizStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropZoneAnswer, setDropZoneAnswer] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleQuizComplete = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const totalTimeSpent = Date.now() - quizStartTime;
    const score = answers.filter((a) => a.isCorrect).length;

    const results: QuizResult = {
      score,
      totalQuestions: questions.length,
      timeSpent: totalTimeSpent,
      answers,
    };

    onQuizComplete(results);
  }, [answers, quizStartTime, questions.length, onQuizComplete]);

  React.useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleQuizComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [handleQuizComplete]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setDropZoneAnswer(answer);
  };

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.content);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedText = e.dataTransfer.getData("text/plain");
    if (draggedItem && draggedItem.type === "answer") {
      setDropZoneAnswer(draggedItem.content);
      setSelectedAnswer(draggedItem.content);
    } else if (droppedText) {
      // Fallback for browsers that don't support the draggedItem state
      setDropZoneAnswer(droppedText);
      setSelectedAnswer(droppedText);
    }
    setDraggedItem(null);
    setIsDragOver(false);
  };

  const handleSubmitAnswer = () => {
    const finalAnswer = selectedAnswer || dropZoneAnswer;
    if (!finalAnswer) return;

    const questionTime = Date.now() - questionStartTime;
    const isCorrect = finalAnswer === currentQuestion.correctAnswer;

    const answerRecord = {
      questionIndex: currentQuestionIndex,
      selectedAnswer: finalAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent: questionTime,
    };

    setAnswers((prev) => [...prev, answerRecord]);
    setShowFeedback(true);

    // Auto-advance after showing feedback
    setTimeout(() => {
      if (isLastQuestion) {
        handleQuizComplete();
      } else {
        handleNextQuestion();
      }
    }, 2000);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer("");
    setDropZoneAnswer("");
    setShowFeedback(false);
    setDraggedItem(null);
    setIsDragOver(false);
    setQuestionStartTime(Date.now());
  };

  const getQuestionText = () => {
    switch (currentQuestion.questionType) {
      case "period":
        return "What historical period is this artifact from?";
      case "culture":
        return "Which culture created this artifact?";
      case "category":
        return "What category does this artifact belong to?";
      default:
        return "Identify this artifact:";
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className={`identification-quiz ${className}`}>
      {/* Quiz Header */}
      <div className="quiz-header mb-6 p-6 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-sand-300" />
              <span className="font-semibold text-white">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sand-400" />
              <span
                className={`font-mono font-bold ${timeRemaining < 60 ? "text-red-300" : "text-white"}`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <div className="text-sm text-ocean-100">
            Score: {answers.filter((a) => a.isCorrect).length}/{answers.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-sand-300 to-sand-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artifact Display */}
        <div className="artifact-display">
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl border border-white/30 p-6">
            <h3 className="text-xl font-bold mb-6 text-white font-fredoka">
              {getQuestionText()}
            </h3>

            <div className="aspect-square relative overflow-hidden rounded-2xl bg-white/10 mb-6 border border-white/20">
              <Image
                src={currentQuestion.artifact.imageUrl}
                alt="Artifact to identify"
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="text-sm text-ocean-100 space-y-2">
              <p>
                <span className="font-semibold text-sand-300">Name:</span>{" "}
                <span className="text-white">
                  {currentQuestion.artifact.name}
                </span>
              </p>
              <p>
                <span className="font-semibold text-sand-300">
                  Description:
                </span>{" "}
                <span className="text-white">
                  {currentQuestion.artifact.description}
                </span>
              </p>
              <p>
                <span className="font-semibold text-sand-300">
                  Discovery Location:
                </span>{" "}
                <span className="text-white">
                  {currentQuestion.artifact.discoveryLocation}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Answer Interface */}
        <div className="answer-interface">
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-3xl border border-white/30 p-6">
            <h4 className="text-lg font-bold mb-6 text-white font-fredoka">
              🎯 Drag and Drop or Click to Answer
            </h4>

            {/* Drop Zone */}
            <div
              className={`
                drop-zone border-2 border-dashed rounded-2xl p-8 mb-6 text-center transition-all duration-300 min-h-[120px] flex items-center justify-center
                ${
                  dropZoneAnswer
                    ? "border-sand-400 bg-sand-400/20 shadow-lg"
                    : "border-white/40 bg-white/10 hover:bg-white/20"
                }
                ${
                  draggedItem || isDragOver
                    ? "border-sand-300 bg-sand-300/30 scale-105 shadow-xl"
                    : ""
                }
              `}
              role="region"
              aria-label="Drop zone for answers"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {dropZoneAnswer ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-sand-300" />
                  <span className="font-bold text-xl text-white">
                    {dropZoneAnswer}
                  </span>
                  <span className="text-sm text-sand-200">
                    Answer selected! Click submit when ready.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white/30"></div>
                  </div>
                  <p className="text-white font-semibold text-lg">
                    Drop your answer here
                  </p>
                  <p className="text-sm text-ocean-100">
                    or click an option below
                  </p>
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="answer-options space-y-3 mb-4">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`
                    answer-option p-4 rounded-2xl border-2 cursor-grab active:cursor-grabbing transition-all transform hover:scale-[1.02] hover:shadow-lg
                    ${
                      selectedAnswer === option
                        ? "border-sand-400 bg-sand-400/20 text-white shadow-lg"
                        : "border-white/30 bg-white/10 text-white hover:border-sand-300 hover:bg-white/20"
                    }
                    ${draggedItem?.content === option ? "opacity-50 scale-95" : ""}
                  `}
                  draggable
                  role="button"
                  tabIndex={0}
                  aria-label={`Select answer: ${option}`}
                  onDragStart={(e) =>
                    handleDragStart(e, {
                      id: `option-${index}`,
                      content: option,
                      type: "answer",
                    })
                  }
                  onDragEnd={() => setDraggedItem(null)}
                  onClick={() => handleAnswerSelect(option)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAnswerSelect(option);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{option}</span>
                    <div className="flex items-center gap-2 text-sm text-ocean-200">
                      <span className="hidden sm:inline">Drag or click</span>
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer && !dropZoneAnswer}
              className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900 text-lg py-3 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🏺 Submit Answer
            </Button>

            {/* Feedback */}
            {showFeedback && (
              <div
                className={`
                feedback mt-6 p-6 rounded-2xl border-2
                ${
                  answers[answers.length - 1]?.isCorrect
                    ? "border-sand-400 bg-sand-400/20"
                    : "border-red-400 bg-red-400/20"
                }
              `}
              >
                <div className="flex items-center gap-3 mb-3">
                  {answers[answers.length - 1]?.isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-sand-300" />
                      <span className="font-bold text-xl text-white">
                        Correct! 🎉
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-300" />
                      <span className="font-bold text-xl text-white">
                        Incorrect 😔
                      </span>
                    </>
                  )}
                </div>
                <p className="text-white mb-2">
                  The correct answer is:{" "}
                  <span className="font-bold text-sand-200">
                    {currentQuestion.correctAnswer}
                  </span>
                </p>
                <p className="text-sm text-ocean-100">
                  {currentQuestion.artifact.significance}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
