"use client";

interface ValidationError {
  id: string;
  errorType:
    | "missing_photo"
    | "missing_measurement"
    | "incomplete_report"
    | "invalid_data";
  description: string;
  severity: "minor" | "moderate" | "severe";
  gridPosition?: { x: number; y: number };
}

interface ValidationCheckerProps {
  errors: ValidationError[];
  photoCount: number;
  measurementCount: number;
  completedSections: number;
  totalSections: number;
  completionPercentage: number;
}

export function ValidationChecker({
  errors,
  photoCount,
  measurementCount,
  completedSections,
  totalSections,
  completionPercentage,
}: ValidationCheckerProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "text-red-400 bg-red-500/20 border-red-400";
      case "moderate":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-400";
      case "minor":
        return "text-blue-400 bg-blue-500/20 border-blue-400";
      default:
        return "text-white/60 bg-white/10 border-white/30";
    }
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case "missing_photo":
        return "📷";
      case "missing_measurement":
        return "📏";
      case "incomplete_report":
        return "📝";
      case "invalid_data":
        return "⚠️";
      default:
        return "❗";
    }
  };

  const requiredPhotos = 4;
  const requiredMeasurements = 6;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-bold text-lg">
            Documentation Progress
          </h3>
          <span className="text-2xl font-bold text-sand-400">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sand-400 to-sand-600 h-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h3 className="text-white font-bold text-lg mb-3">Requirements</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded bg-white/5">
            <span className="text-white flex items-center gap-2">
              <span className="text-xl">📷</span>
              Photos Taken
            </span>
            <span
              className={`font-semibold ${
                photoCount >= requiredPhotos
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {photoCount} / {requiredPhotos}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-white/5">
            <span className="text-white flex items-center gap-2">
              <span className="text-xl">📏</span>
              Measurements Recorded
            </span>
            <span
              className={`font-semibold ${
                measurementCount >= requiredMeasurements
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {measurementCount} / {requiredMeasurements}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-white/5">
            <span className="text-white flex items-center gap-2">
              <span className="text-xl">📝</span>
              Report Sections Complete
            </span>
            <span
              className={`font-semibold ${
                completedSections === totalSections
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {completedSections} / {totalSections}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <span>⚠️</span>
            Issues to Address ({errors.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors.map((error) => (
              <div
                key={error.id}
                className={`p-3 rounded-lg border-2 ${getSeverityColor(error.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">
                    {getErrorIcon(error.errorType)}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold capitalize">
                      {error.severity} Issue
                    </p>
                    <p className="text-sm mt-1">{error.description}</p>
                    {error.gridPosition && (
                      <p className="text-xs mt-1 opacity-80">
                        Location: Grid [{error.gridPosition.x},{" "}
                        {error.gridPosition.y}]
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {errors.length === 0 &&
        photoCount >= requiredPhotos &&
        measurementCount >= requiredMeasurements &&
        completedSections === totalSections && (
          <div className="bg-green-500/20 border-2 border-green-400 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">✅</span>
              <div>
                <p className="text-green-400 font-bold text-lg">
                  Documentation Complete!
                </p>
                <p className="text-white/80 text-sm">
                  All requirements met. Ready to submit your site report.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Tips */}
      <div className="bg-ocean-900/30 rounded-lg p-4">
        <h3 className="text-white font-bold text-sm mb-2">
          💡 Documentation Tips:
        </h3>
        <ul className="text-white/80 text-xs space-y-1">
          <li>• Always include scale references in photos</li>
          <li>• Add north arrows to maintain orientation</li>
          <li>• Use metric units (cm or m) for measurements</li>
          <li>• Write detailed descriptions in each report section</li>
          <li>• Document findings systematically across the grid</li>
        </ul>
      </div>
    </div>
  );
}
