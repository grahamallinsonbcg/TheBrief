type CommentaryProps = {
  text: string;
};

export function Commentary({ text }: CommentaryProps) {
  return (
    <section className="border-l-4 border-accent-muted bg-accent-light px-4 py-3 rounded-r-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">
        Stream Analysis
      </p>
      <p className="text-sm leading-6 text-slate-700">{text}</p>
    </section>
  );
}
