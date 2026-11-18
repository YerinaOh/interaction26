"use client";

import { Fragment, useState } from "react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { ModelBadge } from "@/components/round/ModelBadge";
import { TaskPrompt } from "@/components/round/TaskPrompt";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { slotMapping } from "@/lib/experiment/assignment";
import { getRoundView, upsertRound } from "@/lib/experiment/rounds";
import type { RoundStep } from "@/lib/experiment/steps";
import type { Choice } from "@/lib/experiment/types";

const CHOICES: Choice[] = ["A", "B"];

// M-03 밸런스 게임 · 선택 — 카드를 누르면 선택을 기록하고 바로 M-04로 넘어간다
export function ChoiceScreen({ step }: { step: RoundStep }) {
  const { next, data, updateData } = useExperiment();
  const view = getRoundView(step, data);
  const { labels, actual } = slotMapping(data.assignment);
  const [shownAt] = useState(() => Date.now());

  const choose = (choice: Choice) => {
    const now = Date.now();
    updateData((d) => ({
      ...d,
      rounds: upsertRound(d.rounds, {
        part: step.part,
        round: step.round,
        taskId: view.taskId,
        taskType: view.taskType,
        prompt: view.prompt,
        labels,
        actual,
        choice,
        chosenLabel: labels[choice],
        chosenActual: actual[choice],
        decisionMs: now - shownAt,
        chosenAt: new Date(now).toISOString(),
        ratings: { A: {}, B: {} },
      }),
    }));
    next();
  };

  return (
    <ScreenShell tone="sunken" title="둘 중 어느 쪽이 더 낫나요?" subtitle="두 답변을 읽고 더 마음에 드는 카드를 눌러 주세요.">
      <TaskPrompt taskType={view.taskType} prompt={view.prompt} />

      {/* 세로로 쌓은 두 카드 사이에 VS 표시를 겹쳐 둔다. 두 카드는 항상 같은 모양이어야 한다. */}
      <div className="mt-3 flex flex-col">
        {CHOICES.map((choice, i) => (
          <Fragment key={choice}>
            {i > 0 && (
              <div className="relative z-10 -my-2.5 flex justify-center" aria-hidden>
                <span className="flex h-7 items-center rounded-full bg-ink px-3 text-[12px] font-bold tracking-wide text-white ring-4 ring-canvas">
                  VS
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => choose(choice)}
              className="group flex flex-col rounded-3xl bg-surface p-5 text-left ring-1 ring-transparent transition-[box-shadow,transform] duration-150 hover:ring-accent/40 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[17px] font-bold">응답 {choice}</span>
                <ModelBadge model={labels[choice]} />
              </span>
              <span className="mt-3.5 text-[15px] leading-[1.75] whitespace-pre-line text-ink">{view.answers[choice]}</span>
              <span className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-accent-soft text-[15px] font-semibold text-accent transition-colors group-hover:bg-accent group-hover:text-white group-active:bg-accent group-active:text-white">
                이쪽이 더 나아요
              </span>
            </button>
          </Fragment>
        ))}
      </div>
    </ScreenShell>
  );
}
