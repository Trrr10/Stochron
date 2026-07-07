type DocumentNodeProps = {
  name: string;
  fi: number;
  tfi: number;
  regime: number;
};

// Same 0.25/0.5/0.75 cutoffs used everywhere else (fi_engine.py get_regime,
// NetworkNode.tsx, SourceCategory.tsx).
function getRegimeLabel(value: number): string {
  if (value < 0.25) return 'Stable';
  if (value < 0.5) return 'Watch';
  if (value < 0.75) return 'Alert';
  return 'Critical';
}

export default function DocumentNode({ name, fi, tfi, regime }: DocumentNodeProps) {
  const getRegimeStyle = (value: number) => {
    if (value < 0.25) return 'border-emerald-500/60 bg-emerald-500/[0.06]';
    if (value < 0.5) return 'border-yellow-500/60 bg-yellow-500/[0.06]';
    if (value < 0.75) return 'border-orange-500/60 bg-orange-500/[0.06]';
    return 'border-red-500/60 bg-red-500/[0.06]';
  };

  return (
    <div className={`border-2 rounded-lg p-3 ${getRegimeStyle(regime)} w-64 fi-card`}>
      <div className="font-semibold text-sm mb-2 truncate text-[--foreground]">{name}</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-[--muted-foreground]">FI</div>
          <div className="font-bold text-[--foreground]">{fi.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-[--muted-foreground]">TFI</div>
          <div className="font-bold text-[--foreground]">{tfi.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-[--muted-foreground]">Regime</div>
          <div className="font-bold text-[--foreground]">{getRegimeLabel(regime)}</div>
        </div>
      </div>
    </div>
  );
}