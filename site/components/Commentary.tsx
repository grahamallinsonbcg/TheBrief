type CommentaryProps = {
  text: string;
};

export function Commentary({ text }: CommentaryProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Stream Commentary</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </section>
  );
}
