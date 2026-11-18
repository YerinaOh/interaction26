interface StatTileProps {
  label: React.ReactNode;
  value: number;
  total: number;
  emphasis?: boolean;
}

// 큰 숫자 하나 + 전체 대비 막대
export function StatTile({ label, value, total, emphasis = false }: StatTileProps) {
  const ratio = total ? value / total : 0;
  return (
    <div className={`flex flex-col rounded-2xl p-4 ${emphasis ? "bg-accent text-white" : "bg-field"}`}>
      <p className={`min-h-[2.6em] text-[13px] leading-snug font-medium ${emphasis ? "text-white/85" : "text-ink-2"}`}>{label}</p>
      <p className="mt-3 leading-none">
        <span className="text-[34px] font-bold tracking-tight tabular-nums">{value}</span>
        <span className={`ml-1 text-[14px] font-medium ${emphasis ? "text-white/70" : "text-muted"}`}>/ {total}번</span>
      </p>
      <div
        className={`mt-4 h-1.5 overflow-hidden rounded-full ${emphasis ? "bg-white/25" : "bg-[#e1e5ea]"}`}
        role="img"
        aria-label={`${total}번 중 ${value}번`}
      >
        <div className={`h-full rounded-full ${emphasis ? "bg-white" : "bg-ink-2"}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
