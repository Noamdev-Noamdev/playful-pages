import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { CardGrid } from "@/components/CardGrid";
import { originals } from "@/data/cards";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "playpile — original little games & experiments" },
      {
        name: "description",
        content:
          "A small pile of playful, original web experiments. Tinker, click, and lose an afternoon.",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CardGrid
        eyebrow="Originals"
        title="A pile of playful little things."
        subtitle="Hand-built experiments, toys, and tiny games. New ones appear when nobody's looking."
        items={originals}
      />
    </div>
  );
}
