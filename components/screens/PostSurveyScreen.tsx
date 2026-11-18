"use client";

import { ScreenShell } from "@/components/layout/ScreenShell";
import { Button, ButtonHint } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { LikertScale } from "@/components/ui/LikertScale";
import { Question } from "@/components/ui/Question";
import { TextArea } from "@/components/ui/TextArea";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import type { ChoiceCriterion, PostSurvey } from "@/lib/experiment/types";

const CRITERIA: { value: ChoiceCriterion; label: string }[] = [
  { value: "accuracy", label: "내용의 정확성" },
  { value: "readability", label: "읽기 쉬운 정도" },
  { value: "modelName", label: "AI 모델 이름" },
  { value: "length", label: "답변 길이" },
  { value: "intuition", label: "직관·느낌" },
];

// M-09 마무리 설문
export function PostSurveyScreen() {
  const { next, data, updateData } = useExperiment();
  const survey = data.postSurvey;
  const complete = survey.criteria.length > 0 && survey.trustChange !== undefined;

  const set = (patch: Partial<PostSurvey>) =>
    updateData((d) => ({ ...d, postSurvey: { ...d.postSurvey, ...patch } }));

  const toggle = (value: ChoiceCriterion) =>
    set({
      criteria: survey.criteria.includes(value)
        ? survey.criteria.filter((c) => c !== value)
        : CRITERIA.map((c) => c.value).filter((c) => c === value || survey.criteria.includes(c)),
    });

  const submit = () => {
    updateData((d) => ({ ...d, completedAt: new Date().toISOString() }));
    next();
  };

  return (
    <ScreenShell
      tone="sunken"
      headerNote="마무리 설문"
      title="마지막 설문이에요"
      subtitle="결과를 본 지금의 생각을 들려주세요."
      footer={
        <>
          <Button onClick={submit} disabled={!complete}>
            제출하고 종료
          </Button>
          {!complete && <ButtonHint>Q1·Q2에 답하면 제출할 수 있어요</ButtonHint>}
        </>
      }
    >
      <div className="space-y-3">
        <Question number={1} title="답변을 고를 때 중요했던 기준을 모두 골라 주세요">
          <div className="flex flex-wrap gap-2">
            {CRITERIA.map((c) => (
              <ChoiceChip
                key={c.value}
                type="checkbox"
                name="criteria"
                checked={survey.criteria.includes(c.value)}
                onChange={() => toggle(c.value)}
              >
                {c.label}
              </ChoiceChip>
            ))}
          </div>
        </Question>

        <Question number={2} title="결과를 알게 된 뒤, 방금 고른 답변에 대한 신뢰도가 달라졌나요?">
          <LikertScale
            name="trustChange"
            value={survey.trustChange}
            onChange={(v) => set({ trustChange: v })}
            minLabel="크게 낮아짐"
            maxLabel="크게 높아짐"
          />
        </Question>

        <Question number={3} title="그 밖에 느낀 점 (선택)">
          <TextArea id="comment" value={survey.comment} onChange={(v) => set({ comment: v })} maxLength={500} />
        </Question>
      </div>
    </ScreenShell>
  );
}
