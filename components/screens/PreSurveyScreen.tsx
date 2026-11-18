"use client";

import { ScreenShell } from "@/components/layout/ScreenShell";
import { Button, ButtonHint } from "@/components/ui/Button";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { LikertScale } from "@/components/ui/LikertScale";
import { Question } from "@/components/ui/Question";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import type { PreSurvey, UsageFrequency, UsagePurpose } from "@/lib/experiment/types";

const FREQUENCY_OPTIONS: { value: UsageFrequency; label: string }[] = [
  { value: "daily", label: "거의 매일" },
  { value: "weekly", label: "일주일에 몇 번" },
  { value: "monthly", label: "한 달에 몇 번" },
  { value: "rarely", label: "거의 안 써요" },
];

const PURPOSE_OPTIONS: { value: UsagePurpose; label: string }[] = [
  { value: "work", label: "업무" },
  { value: "study", label: "학습" },
  { value: "writing", label: "글쓰기·번역" },
  { value: "search", label: "정보 검색" },
  { value: "other", label: "기타" },
];

const SUBSCRIPTION_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: "네" },
  { value: false, label: "아니요" },
];

function isPreSurveyComplete(s: PreSurvey): boolean {
  return (
    s.frequency !== undefined &&
    s.purposes.length > 0 &&
    s.paidSubscription !== undefined &&
    s.perceivedDifference !== undefined &&
    s.earlyAdopter !== undefined
  );
}

// M-02 사전 설문
export function PreSurveyScreen() {
  const { next, data, updateData } = useExperiment();
  const survey = data.preSurvey;

  const setSurvey = (patch: Partial<PreSurvey>) =>
    updateData((d) => ({ ...d, preSurvey: { ...d.preSurvey, ...patch } }));

  const togglePurpose = (value: UsagePurpose) =>
    setSurvey({
      purposes: survey.purposes.includes(value)
        ? survey.purposes.filter((p) => p !== value)
        : // 보기 순서대로 저장해 두면 나중에 집계할 때 편하다
          PURPOSE_OPTIONS.map((o) => o.value).filter((p) => p === value || survey.purposes.includes(p)),
    });

  const complete = isPreSurveyComplete(survey);

  return (
    <ScreenShell
      tone="sunken"
      headerNote="사전 설문"
      title="시작 전에 간단히 여쭤볼게요"
      subtitle="정답은 없어요. 평소 모습 그대로 답해 주세요."
      footer={
        <>
          <Button onClick={next} disabled={!complete}>
            시작하기
          </Button>
          {!complete && <ButtonHint>모든 문항에 답하면 시작할 수 있어요</ButtonHint>}
        </>
      }
    >
      <div className="space-y-3">
        <Question number={1} title="생성형 AI를 얼마나 자주 쓰시나요?">
          <div className="flex flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map((o) => (
              <ChoiceChip
                key={o.value}
                type="radio"
                name="frequency"
                checked={survey.frequency === o.value}
                onChange={() => setSurvey({ frequency: o.value })}
              >
                {o.label}
              </ChoiceChip>
            ))}
          </div>
        </Question>

        <Question number={2} title="주로 어떤 용도로 쓰시나요? (복수 선택)">
          <div className="flex flex-wrap gap-2">
            {PURPOSE_OPTIONS.map((o) => (
              <ChoiceChip
                key={o.value}
                type="checkbox"
                name="purposes"
                checked={survey.purposes.includes(o.value)}
                onChange={() => togglePurpose(o.value)}
              >
                {o.label}
              </ChoiceChip>
            ))}
          </div>
        </Question>

        <Question number={3} title="유료 구독을 쓰고 계신가요?">
          <div className="flex flex-wrap gap-2">
            {SUBSCRIPTION_OPTIONS.map((o) => (
              <ChoiceChip
                key={o.label}
                type="radio"
                name="paidSubscription"
                checked={survey.paidSubscription === o.value}
                onChange={() => setSurvey({ paidSubscription: o.value })}
              >
                {o.label}
              </ChoiceChip>
            ))}
          </div>
        </Question>

        <Question number={4} title="AI마다 답변 차이가 크다고 느끼시나요?">
          <LikertScale
            name="perceivedDifference"
            value={survey.perceivedDifference}
            onChange={(v) => setSurvey({ perceivedDifference: v })}
            minLabel="거의 없다"
            maxLabel="매우 크다"
          />
        </Question>

        <Question number={5} title="새 AI 모델이 나오면 바로 써보는 편인가요?">
          <LikertScale
            name="earlyAdopter"
            value={survey.earlyAdopter}
            onChange={(v) => setSurvey({ earlyAdopter: v })}
            minLabel="전혀 아니다"
            maxLabel="매우 그렇다"
          />
        </Question>
      </div>
    </ScreenShell>
  );
}
