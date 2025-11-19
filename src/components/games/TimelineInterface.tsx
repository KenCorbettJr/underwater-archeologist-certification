"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  dateRange: string;
  culture: string;
  isPlaced: boolean;
}

interface TimelineInterfaceProps {
  events: TimelineEvent[];
  userOrder: string[];
  onPlaceEvent: (eventId: string, position: number) => void;
  onReorder: (newOrder: string[]) => void;
  onCheckOrder: () => void;
}

export function TimelineInterface({
  events,
  userOrder,
  onPlaceEvent,
  onReorder,
  onCheckOrder,
}: TimelineInterfaceProps) {
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  const unplacedEvents = events.filter((e) => !e.isPlaced);
  const placedEvents = userOrder
    .map((id) => events.find((e) => e.id === id))
    .filter((e): e is TimelineEvent => e !== undefined);

  const handleDragStart = (eventId: string) => {
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverPosition(position);
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (!draggedEventId) return;

    // Check if event is already placed
    const existingIndex = userOrder.indexOf(draggedEventId);
    if (existingIndex >= 0) {
      // Reorder existing event
      const newOrder = [...userOrder];
      newOrder.splice(existingIndex, 1);
      newOrder.splice(position, 0, draggedEventId);
      onReorder(newOrder);
    } else {
      // Place new event
      onPlaceEvent(draggedEventId, position);
    }

    setDraggedEventId(null);
    setDragOverPosition(null);
  };

  const handleRemoveEvent = (eventId: string) => {
    const newOrder = userOrder.filter((id) => id !== eventId);
    onReorder(newOrder);
  };

  return (
    <div className="space-y-6">
      {/* Unplaced Events Pool */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
        <h3 className="text-white font-bold text-lg mb-3">
          📚 Historical Events ({unplacedEvents.length} remaining)
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {unplacedEvents.map((event) => (
            <div
              key={event.id}
              draggable
              onDragStart={() => handleDragStart(event.id)}
              className="bg-white/20 rounded-lg p-4 cursor-move hover:bg-white/30 transition-all border-2 border-white/30"
            >
              <h4 className="text-white font-semibold mb-1">{event.title}</h4>
              <p className="text-white/70 text-sm mb-2">{event.description}</p>
              <div className="flex justify-between items-center text-xs">
                <span className="text-sand-300">{event.dateRange}</span>
                <span className="text-ocean-300">{event.culture}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">
            ⏳ Your Timeline (Drag events here)
          </h3>
          {placedEvents.length > 0 && (
            <Button
              onClick={onCheckOrder}
              className="bg-sand-400 hover:bg-sand-500 text-sand-900"
            >
              ✓ Check Order
            </Button>
          )}
        </div>

        {placedEvents.length === 0 ? (
          <div
            onDragOver={(e) => handleDragOver(e, 0)}
            onDrop={(e) => handleDrop(e, 0)}
            className="border-4 border-dashed border-white/30 rounded-lg p-12 text-center"
          >
            <p className="text-white/60 text-lg">
              Drag events here to build your timeline
            </p>
            <p className="text-white/40 text-sm mt-2">
              Arrange them in chronological order from oldest to newest
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-sand-400/50" />

            {/* Timeline Events */}
            <div className="space-y-4">
              {placedEvents.map((event, index) => (
                <div key={event.id}>
                  {/* Drop Zone Above */}
                  <div
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`h-8 transition-all ${
                      dragOverPosition === index
                        ? "bg-sand-400/30 border-2 border-sand-400"
                        : "border-2 border-transparent"
                    }`}
                  />

                  {/* Event Card */}
                  <div className="flex items-start gap-4">
                    {/* Timeline Dot */}
                    <div className="relative z-10 w-16 flex justify-center">
                      <div className="w-8 h-8 rounded-full bg-sand-400 border-4 border-white/20 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>

                    {/* Event Content */}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(event.id)}
                      className="flex-1 bg-white/20 rounded-lg p-4 cursor-move hover:bg-white/30 transition-all border-2 border-white/30"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">
                            {event.title}
                          </h4>
                          <p className="text-white/70 text-sm mb-2">
                            {event.description}
                          </p>
                          <div className="flex gap-4 text-xs">
                            <span className="text-sand-300">
                              {event.dateRange}
                            </span>
                            <span className="text-ocean-300">
                              {event.culture}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveEvent(event.id)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Drop Zone Below (for last item) */}
                  {index === placedEvents.length - 1 && (
                    <div
                      onDragOver={(e) => handleDragOver(e, index + 1)}
                      onDrop={(e) => handleDrop(e, index + 1)}
                      className={`h-8 transition-all ${
                        dragOverPosition === index + 1
                          ? "bg-sand-400/30 border-2 border-sand-400"
                          : "border-2 border-transparent"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-ocean-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">💡 Instructions:</h4>
        <ul className="text-white/80 text-sm space-y-1">
          <li>• Drag events from the pool to the timeline</li>
          <li>• Arrange them in chronological order (oldest to newest)</li>
          <li>• You can reorder events by dragging them within the timeline</li>
          <li>
            • Click "Check Order" when you're ready to verify your timeline
          </li>
        </ul>
      </div>
    </div>
  );
}
