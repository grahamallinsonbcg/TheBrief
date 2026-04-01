type HeaderProps = {
  dateLabel?: string;
};

export function Header({ dateLabel }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            AI Signal Reader
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">TheBrief</h1>
        </div>
        <div className="text-sm text-slate-600">{dateLabel}</div>
      </div>
    </header>
  );
}
