export function ComingSoon({ name }: { name: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-foreground bg-card p-10 text-center sm:p-16">
      <p className="font-display text-2xl font-extrabold capitalize">
        {name} — coming soon
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Replace this game's <code className="font-mono">Component</code> in{" "}
        <code className="font-mono">src/games/{name}.tsx</code> to build it out.
      </p>
    </div>
  );
}
