"use client";

import { X, Camera, MapPin, Calendar, Info } from "lucide-react";
import Image from "next/image";

interface ArtifactData {
  _id: string;
  name: string;
  description: string;
  historicalPeriod: string;
  culture: string;
  dateRange: string;
  significance: string;
  imageUrl: string;
  discoveryLocation: string;
  category: string;
}

interface ArtifactPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: ArtifactData | null;
  gridPosition: { x: number; y: number };
  onSavePhoto: () => void;
}

export function ArtifactPhotoModal({
  isOpen,
  onClose,
  artifact,
  gridPosition,
  onSavePhoto,
}: ArtifactPhotoModalProps) {
  if (!isOpen || !artifact) return null;

  const handleSave = () => {
    onSavePhoto();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-ocean-900 to-ocean-800 rounded-3xl border-2 border-white/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-ocean-900/95 backdrop-blur-sm border-b border-white/20 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-sand-400" />
            <div>
              <h2 className="text-xl font-bold text-white font-fredoka">
                Artifact Photography
              </h2>
              <p className="text-xs text-ocean-200">
                In Situ Documentation - Grid Position ({gridPosition.x},{" "}
                {gridPosition.y})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Close photo viewer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Photo Frame */}
          <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-sand-400 shadow-2xl">
            {/* Camera viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-sand-400" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-sand-400" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-sand-400" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-sand-400" />

              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-12 h-12 border border-sand-400/50 rounded-full" />
                <div className="absolute top-1/2 left-0 w-full h-px bg-sand-400/50" />
                <div className="absolute top-0 left-1/2 w-px h-full bg-sand-400/50" />
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-sand-400/50">
                <div className="text-sand-400 text-xs font-mono">
                  GRID: ({gridPosition.x}, {gridPosition.y}) | DEPTH: IN SITU |
                  ISO: 400
                </div>
              </div>
            </div>

            {/* Artifact Image */}
            <div className="relative w-full aspect-[4/3] bg-ocean-950">
              <Image
                src={artifact.imageUrl}
                alt={artifact.name}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Artifact Information Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-sand-400 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-sand-900" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-white font-fredoka mb-1">
                    {artifact.name}
                  </h3>
                  <p className="text-sm text-ocean-100">
                    {artifact.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-sand-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-ocean-200">Period</div>
                        <div className="text-sm text-white font-medium">
                          {artifact.historicalPeriod}
                        </div>
                        <div className="text-xs text-ocean-300">
                          {artifact.dateRange}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-sand-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-ocean-200">Culture</div>
                        <div className="text-sm text-white font-medium">
                          {artifact.culture}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-ocean-200 mb-1">
                        Category
                      </div>
                      <div className="inline-block px-3 py-1 bg-sand-400/20 border border-sand-400 rounded-full text-xs text-sand-300 font-medium">
                        {artifact.category}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-ocean-200 mb-1">
                        Discovery Location
                      </div>
                      <div className="text-sm text-white">
                        {artifact.discoveryLocation}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-ocean-200 mb-1">
                    Historical Significance
                  </div>
                  <p className="text-sm text-ocean-100">
                    {artifact.significance}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Photography Notes */}
          <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-4">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photography Notes
            </h4>
            <ul className="text-sm text-ocean-100 space-y-1">
              <li>✓ Artifact photographed in original position (in situ)</li>
              <li>
                ✓ Grid coordinates recorded: ({gridPosition.x}, {gridPosition.y}
                )
              </li>
              <li>✓ Scale and orientation documented</li>
              <li>✓ Multiple angles captured for 3D reconstruction</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-ocean-900/95 backdrop-blur-sm border-t border-white/20 p-4 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-sand-400 hover:bg-sand-500 text-sand-900 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Save Photo to Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
