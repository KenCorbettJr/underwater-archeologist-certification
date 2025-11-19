"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReportSection {
  id: string;
  sectionType: "site_description" | "methodology" | "findings" | "conclusions";
  content: string;
  isComplete: boolean;
  validationScore: number;
}

interface ReportBuilderProps {
  sections: ReportSection[];
  onSectionUpdate: (sectionType: string, content: string) => void;
}

export function ReportBuilder({
  sections,
  onSectionUpdate,
}: ReportBuilderProps) {
  const [activeSection, setActiveSection] =
    useState<string>("site_description");
  const [content, setContent] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    sections.forEach((s) => {
      initial[s.sectionType] = s.content;
    });
    return initial;
  });

  const handleSave = (sectionType: string) => {
    onSectionUpdate(sectionType, content[sectionType] || "");
  };

  const getSectionInfo = (sectionType: string) => {
    switch (sectionType) {
      case "site_description":
        return {
          title: "Site Description",
          icon: "🏛️",
          prompt:
            "Describe the archaeological site, its location, environmental conditions, and general characteristics.",
          tips: [
            "Include site name and coordinates",
            "Describe water depth and visibility",
            "Note sediment type and current conditions",
            "Mention any unique features",
          ],
        };
      case "methodology":
        return {
          title: "Methodology",
          icon: "🔬",
          prompt:
            "Explain the methods and techniques used for documentation and excavation.",
          tips: [
            "Describe grid system setup",
            "List tools and equipment used",
            "Explain documentation procedures",
            "Note any special techniques applied",
          ],
        };
      case "findings":
        return {
          title: "Findings",
          icon: "🏺",
          prompt:
            "Document all artifacts discovered, their locations, and initial observations.",
          tips: [
            "List all artifacts with grid positions",
            "Describe artifact conditions",
            "Note measurements and dimensions",
            "Include preliminary identifications",
          ],
        };
      case "conclusions":
        return {
          title: "Conclusions",
          icon: "📊",
          prompt:
            "Summarize the significance of findings and recommendations for future work.",
          tips: [
            "Interpret the historical significance",
            "Connect findings to known history",
            "Suggest conservation needs",
            "Recommend further investigation areas",
          ],
        };
      default:
        return {
          title: "Section",
          icon: "📝",
          prompt: "",
          tips: [],
        };
    }
  };

  const currentSection = sections.find((s) => s.sectionType === activeSection);
  const sectionInfo = getSectionInfo(activeSection);

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const info = getSectionInfo(section.sectionType);
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.sectionType)}
              className={`
                px-4 py-2 rounded-lg whitespace-nowrap transition-all
                ${
                  activeSection === section.sectionType
                    ? "bg-sand-400 text-sand-900 font-semibold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }
              `}
            >
              {info.icon} {info.title}
              {section.isComplete && " ✓"}
            </button>
          );
        })}
      </div>

      {/* Active Section Editor */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {sectionInfo.icon} {sectionInfo.title}
          </h3>
          <p className="text-white/80 text-sm">{sectionInfo.prompt}</p>
        </div>

        {/* Tips */}
        <div className="bg-ocean-900/30 rounded-lg p-4">
          <p className="text-white font-semibold mb-2">💡 Tips:</p>
          <ul className="text-white/80 text-sm space-y-1">
            {sectionInfo.tips.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        </div>

        {/* Text Editor */}
        <div>
          <textarea
            value={content[activeSection] || ""}
            onChange={(e) =>
              setContent({ ...content, [activeSection]: e.target.value })
            }
            placeholder={`Write your ${sectionInfo.title.toLowerCase()} here...`}
            className="w-full h-64 p-4 rounded-lg bg-white/20 text-white border border-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-sand-400"
          />
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-white/60">
              {
                (content[activeSection] || "")
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length
              }{" "}
              words
            </span>
            {currentSection && (
              <span
                className={`font-semibold ${
                  currentSection.validationScore >= 70
                    ? "text-green-400"
                    : currentSection.validationScore >= 50
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                Score: {currentSection.validationScore}%
              </span>
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={() => handleSave(activeSection)}
          className="w-full bg-sand-400 hover:bg-sand-500 text-sand-900 font-semibold"
        >
          💾 Save Section
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <p className="text-white font-semibold mb-3">Report Progress:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sections.map((section) => {
            const info = getSectionInfo(section.sectionType);
            return (
              <div
                key={section.id}
                className={`
                  p-3 rounded-lg text-center transition-all
                  ${
                    section.isComplete
                      ? "bg-green-500/20 border-2 border-green-400"
                      : "bg-white/5 border-2 border-white/20"
                  }
                `}
              >
                <div className="text-2xl mb-1">{info.icon}</div>
                <div className="text-xs text-white/80">{info.title}</div>
                <div className="text-sm font-semibold text-white mt-1">
                  {section.validationScore}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
