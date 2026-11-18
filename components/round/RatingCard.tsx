import { ChevronDownIcon, CheckIcon } from "@/components/ui/icons";
import { LikertScale } from "@/components/ui/LikertScale";
import type { ModelId } from "@/lib/experiment/models";
import type { Choice, Rating } from "@/lib/experiment/types";
import { ModelBadge } from "./ModelBadge";

interface RatingCardProps {
  choice: Choice;
  model: ModelId; // 화면에 표시한 모델명
  answer: string;
  chosen: boolean;
  rating: Rating;
  onChange: (patch: Partial<Rating>) => void;
}

const QUESTIONS = [
  { key: "quality", title: "얼마나 좋은 답변인가요?", tag: "품질", minLabel: "별로예요", maxLabel: "최고예요" },
  { key: "trust", title: "얼마나 믿을 만한가요?", tag: "신뢰도", minLabel: "못 믿겠어요", maxLabel: "믿을 만해요" },
] as const;

// M-04 응답 카드: 고른 답변은 포인트 색 테두리와 표시가 붙는다
export function RatingCard({ choice, model, answer, chosen, rating, onChange }: RatingCardProps) {
  return (
    <section
      aria-label={`응답 ${choice}${chosen ? " (내가 고른 답변)" : ""}`}
      className={`rounded-3xl bg-surface p-5 ${chosen ? "ring-2 ring-accent" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold">응답 {choice}</span>
          {chosen ? (
            <span className="inline-flex h-6 items-center gap-0.5 rounded-md bg-accent-soft pr-2 pl-1.5 text-[12px] font-semibold text-accent">
              <CheckIcon className="size-3.5" />
              내가 고른 답변
            </span>
          ) : (
            <span className="text-[12px] font-medium text-muted">선택하지 않음</span>
          )}
        </div>
        <ModelBadge model={model} />
      </div>

      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-[13px] font-medium text-muted select-none hover:text-ink-2 [&::-webkit-details-marker]:hidden">
          답변 다시 보기
          <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <p className="mt-3 rounded-2xl bg-field p-4 text-[14px] leading-[1.7] whitespace-pre-line text-ink-2">{answer}</p>
      </details>

      <div className="mt-5 space-y-5 border-t border-line pt-5">
        {QUESTIONS.map((q) => (
          <fieldset key={q.key}>
            <legend className="mb-3 flex w-full items-center gap-1.5 text-[15px] font-semibold text-ink">
              {q.title}
              <span className="text-[12px] font-medium text-muted">{q.tag}</span>
            </legend>
            <LikertScale
              name={`${choice}-${q.key}`}
              value={rating[q.key]}
              onChange={(v) => onChange({ [q.key]: v })}
              minLabel={q.minLabel}
              maxLabel={q.maxLabel}
            />
          </fieldset>
        ))}
      </div>
    </section>
  );
}
