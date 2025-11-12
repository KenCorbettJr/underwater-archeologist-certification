"use client";

import React from "react";
import { Award, Star, Trophy, Target, Clock, TrendingUp } from "lucide-react";
import { Achievement, GameType } from "../../types";

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "small" | "medium" | "large";
  showDate?: boolean;
}

export function AchievementBadge({
  achievement,
  size = "medium",
  showDate = true,
}: AchievementBadgeProps) {
  const getIcon = () => {
    // Use iconUrl if available, otherwise use default icons
    if (achievement.iconUrl) {
      return (
        <img
          src={achievement.iconUrl}
          alt={achievement.name}
          className="w-full h-full object-contain"
        />
      );
    }

    // Default icons based on achievement name patterns
    if (achievement.name.toLowerCase().includes("expert")) {
      return <Award className="w-full h-full text-purple-600" />;
    }
    if (achievement.name.toLowerCase().includes("master")) {
      return <Trophy className="w-full h-full text-yellow-600" />;
    }
    if (achievement.name.toLowerCase().includes("streak")) {
      return <TrendingUp className="w-full h-full text-blue-600" />;
    }
    if (achievement.name.toLowerCase().includes("time")) {
      return <Clock className="w-full h-full text-green-600" />;
    }
    return <Star className="w-full h-full text-orange-600" />;
  };

  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  };

  const textSizeClasses = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 group">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300`}
      >
        {getIcon()}
      </div>
      <div className="text-center">
        <h4
          className={`font-bold text-gray-800 ${textSizeClasses[size]} group-hover:text-yellow-600 transition-colors`}
        >
          {achievement.name}
        </h4>
        <p className={`text-gray-600 ${textSizeClasses[size]} mt-1`}>
          {achievement.description}
        </p>
        {showDate && (
          <p className="text-xs text-gray-500 mt-2">
            Earned {formatDate(achievement.earnedDate)}
          </p>
        )}
      </div>
    </div>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  title?: string;
}

export function AchievementGrid({
  achievements,
  title = "Your Achievements",
}: AchievementGridProps) {
  if (achievements.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">
          Complete challenges to unlock achievements!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-600" />
        {title}
        <span className="ml-auto text-lg text-gray-600">
          {achievements.length} earned
        </span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size="medium"
          />
        ))}
      </div>
    </div>
  );
}

interface NewAchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function NewAchievementNotification({
  achievement,
  onClose,
}: NewAchievementNotificationProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-6 border-2 border-yellow-400 shadow-2xl max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
            <Trophy className="w-8 h-8 text-yellow-700" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-800 mb-1">
              🎉 Achievement Unlocked!
            </h4>
            <p className="font-semibold text-yellow-700 mb-1">
              {achievement.name}
            </p>
            <p className="text-sm text-gray-700">{achievement.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
