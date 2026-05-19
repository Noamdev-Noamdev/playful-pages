import { CalendarClock } from "lucide-react";
import type { Game } from "./types";
import { TimelineGame } from "./blank-4/TimelineGame";

const TimelineBuilder: Game = {
  slug: "blank-4",
  title: "Timeline Builder",
  description: "Place these events in order. History is trickier than you think.",
  icon: CalendarClock,
  color: "sky",
  category: "originals",
  Component: TimelineGame,
};

export default TimelineBuilder;