"use client";

import { ScreenShell } from "@/components/layout/ScreenShell";
import { RatingCard } from "@/components/round/RatingCard";
import { Button, ButtonHint } from "@/components/ui/Button";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { findRound, getRoundView, isRatingComplete, updateRating } from "@/lib/experiment/rounds";
import type { RoundStep } from "@/lib/experiment/steps";
import type { Choice } from "@/lib/experiment/types";

const CHOICES: Choice[] = ["A", "B"];

function nextLabel(step: RoundStep): string {
  const isLast = step.round === step.total;
  if (step.part === 1) return isLast ? "Part 2로 넘어가기" : `다음 라운드 (${step.round + 1}/${step.total})`;
  return isLast ? "종료" : `다음 질문 하기 (${step.round + 1}/${step.total})`;
}

// M-04 평점 입력 — 두 답변 모두 품질·신뢰도를 매겨야 다음으로 넘어간다
export function RatingScreen({ step }: { step: RoundStep }) {
  const { next, data, updateData } = useExperiment();
  const record = findRound(data.rounds, step);
  const view = getRoundView(step, data);
  const complete = isRatingComplete(record);

  return (
    <ScreenShell
      tone="sunken"
      title={record ? `좋아요, 응답 ${record.choice}를 골랐어요` : "평점 입력"}
      subtitle="두 답변에 각각 점수를 남겨 주세요"
      footer={
        <>
          <Button onClick={next} disabled={!complete}>
            {nextLabel(step)}
          </Button>
          {!complete && <ButtonHint>두 답변의 품질과 신뢰도를 모두 선택해 주세요</ButtonHint>}
        </>
      }
    >
      {record && (
        <div className="flex flex-col gap-3">
          {CHOICES.map((choice) => (
            <RatingCard
              key={choice}
              choice={choice}
              model={record.labels[choice]}
              answer={view.answers[choice]}
              chosen={record.choice === choice}
              rating={record.ratings[choice]}
              onChange={(patch) => updateData((d) => ({ ...d, rounds: updateRating(d.rounds, step, choice, patch) }))}
            />
          ))}
        </div>
      )}
    </ScreenShell>
  );
}
