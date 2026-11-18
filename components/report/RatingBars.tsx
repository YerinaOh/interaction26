import { MODEL_NAMES, type ModelId } from "@/lib/experiment/models";
import type { HaloStats, RatingMeans } from "@/lib/experiment/stats";

const SCALE_MAX = 7;
const METRICS: { key: keyof RatingMeans; label: string }[] = [
  { key: "quality", label: "품질" },
  { key: "trust", label: "신뢰도" },
];
const MODELS: ModelId[] = ["opus", "haiku"];

// 표시된 이름별 평균 점수 (7점 척도). 막대는 0에서 시작하고 값은 막대 끝에 적는다.
export function RatingBars({ stats }: { stats: HaloStats }) {
  return (
    <div className="space-y-5">
      {METRICS.map((metric) => (
        <div key={metric.key}>
          <p className="text-[14px] font-semibold text-ink">평균 {metric.label} 점수</p>
          <div className="mt-2.5 space-y-2">
            {MODELS.map((model) => {
              const value = stats.ratingsByLabel[model][metric.key];
              return (
                <div key={model} className="grid grid-cols-[5.5rem_1fr_2.25rem] items-center gap-3">
                  <span className="text-[13px] text-ink-2">‘{MODEL_NAMES[model].replace("Claude ", "")}’ 카드</span>
                  <div
                    className="h-2.5 rounded-full bg-field"
                    role="img"
                    aria-label={`${MODEL_NAMES[model]}라고 적힌 답변 평균 ${metric.label} ${value?.toFixed(1) ?? "없음"}점`}
                  >
                    {value !== null && (
                      <div
                        className={`h-full rounded-full ${model === "opus" ? "bg-accent" : "bg-[#c4cad3]"}`}
                        style={{ width: `${(value / SCALE_MAX) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="text-right text-[15px] font-bold tabular-nums">{value?.toFixed(1) ?? "–"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
