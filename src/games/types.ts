import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { CardColor } from "@/components/PlayCard";

export type GameCategory = "originals" | "classics";

export interface Game {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: CardColor;
  category: GameCategory;
  Component: ComponentType;
}
