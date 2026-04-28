import { FlaskConical } from "lucide-react";
import type { Game } from "./types";
import { AlchemyGame } from "./blank-2/AlchemyGame";

const BuildYourOwn: Game = {
  slug: "blank-2",
  title: "Build Your Own",
  description: "Combine elements to discover the universe. Start with fire.",
  icon: FlaskConical,
  color: "yellow",
  category: "originals",
  Component: AlchemyGame,
};

export default BuildYourOwn;