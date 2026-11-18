"use client";

import { ScreenShell } from "@/components/layout/ScreenShell";
import { Button, ButtonHint } from "@/components/ui/Button";
import { ArrowRightIcon, InfoIcon } from "@/components/ui/icons";
import { TextArea } from "@/components/ui/TextArea";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { PART2_ATTEMPTS } from "@/lib/experiment/part2Content";
import { findPart2, upsertPart2 } from "@/lib/experiment/rounds";
import type { RoundStep } from "@/lib/experiment/steps";
import { MAX_QUESTION_CHARS, MIN_QUESTION_CHARS } from "@/lib/generation/shared";

// M-05 내 질문 입력 — 입력하는 내용은 바로 저장돼 새로고침해도 남는다
export function QuestionInputScreen({ step }: { step: RoundStep }) {
  const { next, data, updateData } = useExperiment();
  const attempt = PART2_ATTEMPTS[step.round - 1];
  const question = findPart2(data.part2, step.round)?.question ?? "";
  const canSubmit = question.trim().length >= MIN_QUESTION_CHARS;

  const setQuestion = (value: string) =>
    updateData((d) => ({ ...d, part2: upsertPart2(d.part2, step.round, { question: value.slice(0, MAX_QUESTION_CHARS) }) }));

  return (
    <ScreenShell
      title="평소 AI에게 묻는 질문을 직접 입력해 보세요"
      subtitle={attempt.guide}
      footer={
        <>
          <Button onClick={next} disabled={!canSubmit}>
            두 AI에게 동시에 묻기
          </Button>
          {!canSubmit && <ButtonHint>{MIN_QUESTION_CHARS}자 이상 입력하면 물어볼 수 있어요</ButtonHint>}
        </>
      }
    >
      <label htmlFor="question" className="mb-2 block text-[13px] font-medium text-ink-2">
        내 질문
      </label>
      <TextArea
        id="question"
        value={question}
        onChange={setQuestion}
        maxLength={MAX_QUESTION_CHARS}
        rows={6}
        placeholder="질문을 입력하세요"
        hint={
          <span className="flex items-center gap-1">
            <InfoIcon className="size-3.5" />
            개인정보·기밀은 입력하지 마세요
          </span>
        }
      />

      <section className="mt-8">
        <h2 className="text-[13px] font-medium text-ink-2">이런 질문은 어때요?</h2>
        <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
          {attempt.examples.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => setQuestion(example)}
                className="flex w-full items-center justify-between gap-3 bg-surface px-4 py-3.5 text-left text-[14px] leading-snug text-ink transition-colors hover:bg-field active:bg-field"
              >
                {example}
                <ArrowRightIcon className="size-4 shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </ScreenShell>
  );
}
