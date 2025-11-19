"use client";

import { useState } from "react";

interface ContextCard {
  id: string;
  title: string;
  period: string;
  description: string;
  keyFacts: string[];
  culturalContext: string;
}

interface ContextCardsProps {
  selectedPeriod?: string;
}

export function ContextCards({ selectedPeriod }: ContextCardsProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const contextCards: ContextCard[] = [
    {
      id: "ancient_greek",
      title: "Ancient Greek Maritime Trade",
      period: "500-300 BCE",
      description:
        "The Ancient Greeks were master seafarers who established extensive trade networks across the Mediterranean Sea.",
      keyFacts: [
        "Used amphorae to transport wine, olive oil, and grain",
        "Developed advanced shipbuilding techniques",
        "Established colonies throughout the Mediterranean",
        "Created detailed navigation charts and sailing routes",
      ],
      culturalContext:
        "Greek maritime trade was essential to their economy and cultural exchange, spreading Greek culture, art, and philosophy throughout the ancient world.",
    },
    {
      id: "roman_empire",
      title: "Roman Naval Power",
      period: "100-200 CE",
      description:
        "The Roman Empire controlled the Mediterranean through superior naval technology and organization.",
      keyFacts: [
        "Built massive merchant fleets for trade",
        "Transported goods from across the empire",
        "Used standardized pottery and containers",
        "Established maritime trade routes to India and Africa",
      ],
      culturalContext:
        "Roman control of the seas enabled the Pax Romana, a period of relative peace that facilitated unprecedented trade and cultural exchange.",
    },
    {
      id: "viking_age",
      title: "Viking Exploration",
      period: "800-1000 CE",
      description:
        "Norse seafarers explored and settled vast territories using their innovative longship designs.",
      keyFacts: [
        "Reached North America centuries before Columbus",
        "Established trade routes from Scandinavia to Constantinople",
        "Used advanced navigation techniques",
        "Built versatile ships for both warfare and trade",
      ],
      culturalContext:
        "Viking maritime culture shaped medieval Europe through trade, raids, and settlement, leaving lasting impacts on language, culture, and genetics.",
    },
    {
      id: "age_of_exploration",
      title: "Spanish Colonial Trade",
      period: "1500-1700 CE",
      description:
        "Spanish galleons transported vast wealth from the Americas to Europe, establishing global trade networks.",
      keyFacts: [
        "Carried gold, silver, and precious goods",
        "Established the Manila Galleon trade route",
        "Connected Europe, Americas, and Asia",
        "Faced threats from pirates and storms",
      ],
      culturalContext:
        "The Spanish treasure fleets fundamentally changed the global economy, introducing New World resources to Europe and Asia while establishing colonial systems.",
    },
    {
      id: "industrial_era",
      title: "Industrial Revolution at Sea",
      period: "1850-1900 CE",
      description:
        "Steam power revolutionized maritime trade, enabling faster and more reliable ocean transportation.",
      keyFacts: [
        "Steamships replaced sailing vessels",
        "Enabled regular transatlantic passenger service",
        "Facilitated mass immigration and trade",
        "Led to standardized shipping containers",
      ],
      culturalContext:
        "The industrial revolution at sea connected the world like never before, enabling mass migration, global trade, and cultural exchange on an unprecedented scale.",
    },
  ];

  const filteredCards = selectedPeriod
    ? contextCards.filter((card) => card.id === selectedPeriod)
    : contextCards;

  return (
    <div className="space-y-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h3 className="text-white font-bold text-lg mb-3">
          📖 Historical Context
        </h3>
        <p className="text-white/70 text-sm mb-4">
          Learn about the historical periods and cultures represented in the
          timeline
        </p>

        <div className="space-y-3">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-white/10 rounded-lg overflow-hidden border-2 border-white/20"
            >
              {/* Card Header */}
              <button
                onClick={() =>
                  setExpandedCard(expandedCard === card.id ? null : card.id)
                }
                className="w-full p-4 text-left hover:bg-white/5 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-semibold mb-1">
                      {card.title}
                    </h4>
                    <p className="text-sand-300 text-sm">{card.period}</p>
                  </div>
                  <span className="text-white text-xl">
                    {expandedCard === card.id ? "▼" : "▶"}
                  </span>
                </div>
              </button>

              {/* Expanded Content */}
              {expandedCard === card.id && (
                <div className="p-4 pt-0 space-y-3">
                  <p className="text-white/80 text-sm">{card.description}</p>

                  <div>
                    <p className="text-white font-semibold text-sm mb-2">
                      Key Facts:
                    </p>
                    <ul className="text-white/70 text-sm space-y-1">
                      {card.keyFacts.map((fact, index) => (
                        <li key={index}>• {fact}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-ocean-900/30 rounded p-3">
                    <p className="text-white font-semibold text-sm mb-1">
                      Cultural Context:
                    </p>
                    <p className="text-white/70 text-sm">
                      {card.culturalContext}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-ocean-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">🕰️ Quick Timeline:</h4>
        <div className="space-y-1 text-sm text-white/80">
          <div>500-300 BCE: Ancient Greek Period</div>
          <div>100-200 CE: Roman Empire</div>
          <div>800-1000 CE: Viking Age</div>
          <div>1500-1700 CE: Age of Exploration</div>
          <div>1850-1900 CE: Industrial Era</div>
        </div>
      </div>
    </div>
  );
}
