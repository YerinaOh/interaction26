import { Fragment } from "react";
import { MODEL_NAMES, type ModelId } from "@/lib/experiment/models";
import type { HaloStats } from "@/lib/experiment/stats";

// 리포트 전체에서 Opus = 포인트 색, Haiku = 회색. 색에만 의존하지 않도록 글자(O/H)도 함께 쓴다.
function Cell({ model, label }: { model: ModelId; label: string }) {
  const opus = model === "opus";
  return (
    <span
      title={label}
      aria-label={label}
      className={`flex aspect-square w-full max-w-9 items-center justify-center rounded-lg text-[12px] font-bold ${
        opus ? "bg-accent text-white" : "bg-field text-ink-2"
      }`}
    >
      {opus ? "O" : "H"}
    </span>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-accent" aria-hidden /> O = {MODEL_NAMES.opus}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-[#d1d6db]" aria-hidden /> H = {MODEL_NAMES.haiku}
      </span>
    </div>
  );
}

// 라운드마다 '고른 카드에 적힌 이름'과 '그 카드의 실제 모델'을 위아래로 맞대어 보여준다.
// 칸 크기는 카드 너비에 맞춰 줄어들어 좁은 폰에서도 넘치지 않는다.
export function RoundMatrix({ stats }: { stats: HaloStats }) {
  const parts = stats.byPart
    .filter((p) => p.total > 0)
    .map((p) => ({ part: p.part, rounds: stats.rounds.filter((r) => r.part === p.part) }));
  // 라벨 열 + (파트별 라운드 열들) 사이에 좁은 간격 열
  const columns = ["auto", ...parts.map((p) => `repeat(${p.rounds.length}, minmax(0, 1fr))`)].join(" ");
  const rows = [
    { label: "적힌 이름", model: (r: (typeof stats.rounds)[number]) => r.chosenLabel, describe: (r: (typeof stats.rounds)[number]) => `Part ${r.part} ${r.round}회차 (${r.taskType}): '${MODEL_NAMES[r.chosenLabel]}' 카드 선택` },
    { label: "실제 모델", model: (r: (typeof stats.rounds)[number]) => r.chosenActual, describe: (r: (typeof stats.rounds)[number]) => `Part ${r.part} ${r.round}회차: 실제로는 ${MODEL_NAMES[r.chosenActual]} 답변` },
  ];

  return (
    <div className="grid items-center gap-x-1 gap-y-1.5" style={{ gridTemplateColumns: columns }}>
      <span />
      {parts.map((p, i) => (
        <span
          key={p.part}
          className={`text-[12px] font-semibold whitespace-nowrap text-ink-2 ${i > 0 ? "border-l border-line pl-1.5" : ""}`}
          style={{ gridColumn: `span ${p.rounds.length}` }}
        >
          Part {p.part}
        </span>
      ))}
      {rows.map((row) => (
        <Fragment key={row.label}>
          <span className="pr-2 text-[12px] font-medium whitespace-nowrap text-muted">{row.label}</span>
          {parts.map((p, i) =>
            p.rounds.map((r, j) => (
              <span key={`${p.part}-${r.round}`} className={`flex justify-center ${i > 0 && j === 0 ? "border-l border-line pl-1.5" : ""}`}>
                <Cell model={row.model(r)} label={row.describe(r)} />
              </span>
            )),
          )}
        </Fragment>
      ))}
    </div>
  );
}
