"use client";

import { ScreenShell } from "@/components/layout/ScreenShell";
import { Button, ButtonHint } from "@/components/ui/Button";
import { LikertScale } from "@/components/ui/LikertScale";
import { Question } from "@/components/ui/Question";
import { TextArea } from "@/components/ui/TextArea";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import type { FinalCheck } from "@/lib/experiment/types";

// PPT에서 "ㅇㅇㅇ"로 비어 있던 두 문항. 결과를 알기 전의 자기 보고를 받아 둔다.
const Q1 = "답변을 고를 때 가장 눈여겨본 점은 무엇이었나요? (선택)";
const Q2 = "화면에 적힌 AI 모델 이름이 내 선택에 영향을 줬다고 생각하나요?";

// M-07 마무리 확인 (결과 공개 전)
export function FinalCheckScreen() {
  const { next, data, updateData } = useExperiment();
  const answers = data.finalCheck;
  const complete = answers.nameInfluence !== undefined;

  const set = (patch: Partial<FinalCheck>) =>
    updateData((d) => ({ ...d, finalCheck: { ...d.finalCheck, ...patch } }));

  return (
    <ScreenShell
      tone="sunken"
      headerNote="마무리 확인"
      title={"다 골랐어요!\n제출 전에 두 가지만 답해 주세요"}
      footer={
        <>
          <Button onClick={next} disabled={!complete}>
            결과 공개하기
          </Button>
          {!complete && <ButtonHint>Q2에 답하면 결과를 볼 수 있어요</ButtonHint>}
        </>
      }
    >
      <div className="space-y-3">
        <Question number={1} title={Q1}>
          <TextArea id="reflection" value={answers.reflection} onChange={(v) => set({ reflection: v })} maxLength={300} />
        </Question>
        <Question number={2} title={Q2}>
          <LikertScale
            name="nameInfluence"
            value={answers.nameInfluence}
            onChange={(v) => set({ nameInfluence: v })}
            minLabel="전혀 아니다"
            maxLabel="매우 그렇다"
          />
        </Question>
      </div>
    </ScreenShell>
  );
}
