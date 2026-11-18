"use client";

import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { Button } from "@/components/ui/Button";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { findPart2, upsertPart2 } from "@/lib/experiment/rounds";
import type { RoundStep } from "@/lib/experiment/steps";
import { GenerateError, requestAnswers, wait } from "@/lib/generation/client";

// 답변이 더 빨리 와도 이 시간만큼은 '생성 중…'을 보여 준다 (2~3초)
const MIN_LOADING_MS = 2500;

// 네트워크 끊김(0), 요청 과다(429), 서버 오류(5xx)
const isRetryable = (error: GenerateError) => error.status === 0 || error.status === 429 || error.status >= 500;

// M-06 동시 생성 대기 — 두 답변이 모두 준비되면 함께 M-03으로 넘긴다
export function GeneratingScreen({ step }: { step: RoundStep }) {
  const { next, back, data, updateData } = useExperiment();
  const question = findPart2(data.part2, step.round)?.question.trim() ?? "";
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<GenerateError | null>(null);
  const [progressStarted, setProgressStarted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = Date.now();
    setError(null);
    setProgressStarted(false);
    const frame = requestAnimationFrame(() => setProgressStarted(true));

    Promise.all([requestAnswers(question, controller.signal), wait(MIN_LOADING_MS, controller.signal)])
      .then(([result]) => {
        updateData((d) => ({
          ...d,
          part2: upsertPart2(d.part2, step.round, {
            answers: result.answers,
            source: result.source,
            generatedAt: new Date().toISOString(),
            generationMs: Date.now() - startedAt,
          }),
        }));
        next();
      })
      .catch((e: unknown) => {
        // 화면을 떠나거나 개발 모드에서 effect가 두 번 실행될 때의 취소는 오류가 아니다
        if (controller.signal.aborted) return;
        setError(e instanceof GenerateError ? e : new GenerateError("네트워크 연결을 확인하고 다시 시도해 주세요.", 0));
      });

    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [question, attempt, step.round, next, updateData]);

  return (
    <ScreenShell
      tone="sunken"
      title={error ? "답변을 받지 못했어요" : "두 AI가 답변을 쓰고 있어요"}
      subtitle={error ? error.message : "두 응답이 모두 준비되면 함께 표시됩니다"}
      footer={
        error ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={back}>
              질문 바꾸기
            </Button>
            {/* 입력 오류(400)나 거절(422)은 같은 질문으로 다시 해도 소용없으므로 재시도는 일시적 오류에만 보인다 */}
            {isRetryable(error) && <Button onClick={() => setAttempt((n) => n + 1)}>다시 시도</Button>}
          </div>
        ) : undefined
      }
    >
      {!error && (
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="답변 생성 중">
          <div
            className="h-full rounded-full bg-accent ease-out"
            style={{ width: progressStarted ? "90%" : "4%", transition: `width ${MIN_LOADING_MS}ms` }}
          />
        </div>
      )}

      <div className="rounded-3xl bg-surface p-5">
        <span className="inline-flex h-6 items-center rounded-md bg-accent-soft px-2 text-[12px] font-semibold text-accent">내 질문</span>
        <p className="mt-3 text-[15px] leading-[1.7] text-ink">{question}</p>
      </div>

      <div className="mt-3 space-y-3" aria-hidden>
        {(["A", "B"] as const).map((choice) => (
          <div key={choice} className="rounded-3xl bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-bold">응답 {choice}</span>
              {/* 모델명은 답변이 나온 뒤에 공개한다 */}
              <span className={`h-7 w-28 rounded-full ${error ? "bg-field" : "skeleton"}`} />
            </div>
            <div className="mt-4 space-y-2.5">
              {["w-full", "w-[92%]", "w-[78%]", "w-[60%]"].map((w) => (
                <div key={w} className={`h-3 rounded-full ${w} ${error ? "bg-field" : "skeleton"}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
