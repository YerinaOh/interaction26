"use client";

import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { isRoundStep } from "@/lib/experiment/steps";

const IS_DEV = process.env.NODE_ENV !== "production";

// 입력 위주 화면은 흰 바탕, 카드가 올라가는 화면은 회색 바탕을 쓴다
const TONES = {
  plain: "var(--color-surface)",
  sunken: "var(--color-canvas)",
} as const;

interface ScreenShellProps {
  title?: string;
  subtitle?: string;
  // 헤더 왼쪽의 현재 단계 이름 (예: "참여 안내", "사전 설문")
  headerNote?: string;
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  // 화면 하단에 고정되는 주요 액션 영역
  footer?: React.ReactNode;
}

export function ScreenShell({ title, subtitle, headerNote, tone = "plain", children, footer }: ScreenShellProps) {
  const { step, stepIndex, totalSteps, reset } = useExperiment();
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const label = isRoundStep(step)
    ? step.part === 1
      ? `Part 1 · 라운드 ${step.round}/${step.total}`
      : `Part 2 · 직접 질문${step.total > 1 ? ` ${step.round}/${step.total}` : ""}`
    : headerNote;

  return (
    // 모바일 세로 화면 기준 단일 컬럼. 넓은 화면에서는 폰 크기 프레임으로 보여준다.
    <div className="min-h-dvh bg-(--screen-bg) sm:bg-[#e9ecef] sm:py-6" style={{ "--screen-bg": TONES[tone] } as React.CSSProperties}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-(--screen-bg) sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[28px] sm:shadow-[0_8px_40px_rgba(25,31,40,0.08)]">
        <header className="sticky top-0 z-20 bg-(--screen-bg)/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="h-[3px] bg-line/70" aria-hidden>
            <div className="h-full rounded-r-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex h-12 items-center justify-between px-5">
            <span className="text-[13px] font-semibold text-muted">{label}</span>
            {IS_DEV && (
              <button
                type="button"
                onClick={reset}
                title="개발용: 입력한 응답을 모두 지우고 처음부터 다시 시작"
                className="rounded-full px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-line hover:text-ink"
              >
                처음으로
              </button>
            )}
          </div>
        </header>

        <main key={stepIndex} className="enter flex flex-1 flex-col px-5 pt-3 pb-8">
          {title && <h1 className="text-[24px] leading-[1.4] font-bold tracking-[-0.02em] whitespace-pre-line text-ink">{title}</h1>}
          {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{subtitle}</p>}
          <div className={title || subtitle ? "mt-7 flex-1" : "flex-1"}>{children}</div>
        </main>

        {footer && (
          <footer className="sticky bottom-0 z-20 bg-gradient-to-t from-(--screen-bg) from-70% to-transparent px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
