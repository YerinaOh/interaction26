"use client";

import { ScreenShell } from "@/components/layout/ScreenShell";
import { CheckIcon } from "@/components/ui/icons";

// 제출 완료 — PPT에는 없지만 '제출하고 종료' 이후 머무를 화면이 필요하다
export function CompleteScreen() {
  return (
    <ScreenShell headerNote="제출 완료">
      <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent text-white">
          <CheckIcon className="size-8" />
        </span>
        <h1 className="mt-6 text-[24px] font-bold tracking-[-0.02em]">제출이 완료되었어요</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          참여해 주셔서 감사합니다.
          <br />이 창을 닫으셔도 됩니다.
        </p>
      </div>
    </ScreenShell>
  );
}
