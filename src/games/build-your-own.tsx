import { FlaskConical } from "lucide-react";
import type { Game } from "./types";
import { AlchemyGame } from "./build-your-own/AlchemyGame";

const BuildYourOwn: Game = {
  slug: "build-your-own",
  title: "Build Your Own",
  description: "Combine elements to discover the universe. Start with fire.",
  icon: FlaskConical,
  color: "yellow",
  category: "originals",
  Component: AlchemyGame,
};

export default BuildYourOwn;
