type HeaderProps = {
  dateLabel?: string;
};

export function Header({ dateLabel }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="border-l-[3px] border-accent pl-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            AI Signal Reader
          </p>
          <h1 className="text-2xl font-bold text-slate-900">TheBrief</h1>
        </div>
        {dateLabel && (
          <div className="text-sm font-medium text-slate-500">{dateLabel}</div>
        )}
      </div>
    </header>
  );
}
