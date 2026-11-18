"use client";

import { ScreenShell } from "@/components/layout/ScreenShell";
import { Button, ButtonHint } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { InfoIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/TextField";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { PART1_ROUNDS, PART2_ROUNDS } from "@/lib/experiment/steps";
import type { Consent, Participant } from "@/lib/experiment/types";

const CONSENT_ITEMS: { key: keyof Consent; label: string }[] = [
  { key: "research", label: "학술 연구이며 진행 절차를 이해했습니다" },
  { key: "dataUse", label: "익명 처리된 응답 데이터의 연구 활용에 동의합니다" },
  { key: "noPersonalInfo", label: "직접 질문에 개인정보·기밀을 입력하지 않겠습니다" },
];

// M-01 동의·안내
export function ConsentScreen() {
  const { next, data, updateData } = useExperiment();
  const { consent, participant } = data;
  const allAgreed = CONSENT_ITEMS.every(({ key }) => consent[key]);

  const setConsent = (patch: Partial<Consent>) => updateData((d) => ({ ...d, consent: { ...d.consent, ...patch } }));
  const setAll = (checked: boolean) =>
    setConsent(Object.fromEntries(CONSENT_ITEMS.map(({ key }) => [key, checked])) as Partial<Consent>);
  const setParticipant = (patch: Partial<Participant>) =>
    updateData((d) => ({ ...d, participant: { ...d.participant, ...patch } }));

  const canStart = allAgreed && participant.studentId.trim() !== "" && participant.name.trim() !== "";

  return (
    <ScreenShell
      tone="sunken"
      headerNote="참여 안내"
      title="AI 답변 선호도 조사"
      subtitle="두 AI의 답변을 비교하고, 더 마음에 드는 쪽을 골라 주세요."
      footer={
        <>
          <Button onClick={next} disabled={!canStart}>
            참여 시작
          </Button>
          {!canStart && <ButtonHint>모든 항목에 동의하고 학번·이름을 입력해 주세요</ButtonHint>}
        </>
      }
    >
      <div className="-mt-3 mb-6 flex gap-2">
        <span className="inline-flex h-7 items-center rounded-full bg-surface px-3 text-[13px] font-medium text-ink-2">
          소요 시간 약 10분
        </span>
        <span className="inline-flex h-7 items-center rounded-full bg-surface px-3 text-[13px] font-medium text-ink-2">
          총 {PART1_ROUNDS + PART2_ROUNDS}라운드
        </span>
      </div>

      <div className="space-y-3">
        <fieldset className="rounded-3xl bg-surface px-5 pt-3 pb-2">
          <legend className="sr-only">참여 동의</legend>
          <Checkbox checked={allAgreed} onChange={setAll} strong>
            전체 동의하기
          </Checkbox>
          <div className="my-1.5 border-t border-line" />
          {CONSENT_ITEMS.map(({ key, label }) => (
            <Checkbox key={key} checked={consent[key]} onChange={(checked) => setConsent({ [key]: checked })}>
              {label}
            </Checkbox>
          ))}
        </fieldset>

        <section className="space-y-4 rounded-3xl bg-surface p-5">
          <h2 className="text-[16px] font-semibold">참가자 정보</h2>
          <TextField
            id="studentId"
            label="학번"
            value={participant.studentId}
            onChange={(v) => setParticipant({ studentId: v.replace(/\D/g, "") })}
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            placeholder="숫자만 입력해 주세요"
          />
          <TextField
            id="name"
            label="이름"
            value={participant.name}
            onChange={(v) => setParticipant({ name: v })}
            autoComplete="name"
            maxLength={20}
            placeholder="이름을 입력해 주세요"
          />
        </section>

        <div className="flex gap-2.5 px-1 pt-2 text-[13px] leading-relaxed text-muted">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            학번·이름 암호화되어 저장됩니다.
            <br />
            실험 종료 후 모든 데이터는 폐기됩니다.
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}
