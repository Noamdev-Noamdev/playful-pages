import { CalendarClock } from "lucide-react";
import type { Game } from "./types";
import { TimelineGame } from "./timeline-builder/TimelineGame";

const TimelineBuilder: Game = {
  slug: "timeline-builder",
  title: "Timeline Builder",
  description: "Place these events in order. History is trickier than you think.",
  icon: CalendarClock,
  color: "sky",
  category: "originals",
  Component: TimelineGame,
  dailySlug: "timeline-builder",
};

export default TimelineBuilder;