"use client";

import { useEffect, useMemo } from "react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { RatingBars } from "@/components/report/RatingBars";
import { Legend, RoundMatrix } from "@/components/report/RoundMatrix";
import { StatTile } from "@/components/report/StatTile";
import { ModelBadge } from "@/components/round/ModelBadge";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useExperiment } from "@/lib/experiment/ExperimentProvider";
import { slotMapping, type LabelCondition } from "@/lib/experiment/assignment";
import { MODEL_BLURBS, MODEL_NAMES } from "@/lib/experiment/models";
import { computeHaloStats, type HaloStats } from "@/lib/experiment/stats";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface p-5">
      <h2 className="text-[17px] font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function headline(stats: HaloStats) {
  if (stats.preferredActual === "tie") {
    return { title: "두 모델의 답변을\n비슷하게 고르셨어요", body: "실제로 답변을 쓴 모델 기준으로, 두 모델을 같은 횟수만큼 골랐어요." };
  }
  return {
    title: `${MODEL_NAMES[stats.preferredActual]} 모델을\n더 선호하시는군요!`,
    body: `${MODEL_BLURBS[stats.preferredActual]} (실제로 답변을 쓴 모델 기준이에요)`,
  };
}

function insight(stats: HaloStats, condition: LabelCondition): string {
  const half = stats.total / 2;
  // 라벨이 정상인 세션: 이름과 실제 모델이 같으므로 '속았다'는 해석을 하지 않는다
  if (condition === "match") {
    if (stats.labelOpus === half) return "두 이름의 카드를 똑같은 횟수로 골랐어요.";
    const more = stats.labelOpus > half ? "Opus" : "Haiku";
    return `이번에는 카드에 적힌 이름이 실제 모델과 같았어요. ‘${more}’ 쪽을 더 많이 골랐는데, 이름과 내용 중 무엇이 더 크게 작용했을지는 다른 참가자들의 결과와 비교해 분석할 예정이에요.`;
  }
  if (stats.labelOpus > half) {
    const howMany = stats.labelOpusButHaiku === stats.labelOpus ? "모두" : `그중 ${stats.labelOpusButHaiku}번은`;
    return `‘Opus’라고 적힌 카드를 ${stats.labelOpus}번 골랐지만, ${howMany} 사실 Haiku가 쓴 답변이었어요. 이름이 주는 인상, 즉 후광효과가 선택에 영향을 줬을 수 있어요.`;
  }
  if (stats.labelOpus < half) {
    return `이름보다 내용을 보고 고르셨네요. ‘Opus’라는 이름에 끌리지 않고, 실제 Opus가 쓴 답변을 ${stats.actualOpus}번 골랐어요.`;
  }
  return "두 이름의 카드를 똑같은 횟수로 골랐어요. 이름에 크게 흔들리지 않으셨네요.";
}

// M-08 결과 공개 — 표시된 이름과 실제 모델을 비교하는 후광효과 반전 리포트
export function RevealScreen() {
  const { next, data, updateData } = useExperiment();
  const stats = useMemo(() => computeHaloStats(data.rounds), [data.rounds]);
  const { title, body } = headline(stats);
  const { condition } = data.assignment;
  const { labels, actual } = slotMapping(data.assignment);

  useEffect(() => {
    updateData((d) => (d.revealedAt ? d : { ...d, revealedAt: new Date().toISOString() }));
  }, [updateData]);

  return (
    <ScreenShell
      tone="sunken"
      headerNote="결과 공개"
      title={title}
      subtitle={body}
      footer={<Button onClick={next}>마무리 설문으로</Button>}
    >
      <div className="space-y-3">
        <Card title="방금 본 화면은 이랬어요">
          <div className="space-y-2">
            {(["A", "B"] as const).map((choice) => (
              <div key={choice} className="flex items-center gap-3 rounded-2xl bg-field px-4 py-3.5">
                <span className="w-14 shrink-0 text-[15px] font-bold">응답 {choice}</span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5">
                  {labels[choice] !== actual[choice] && (
                    <>
                      <span className="text-[13px] text-muted line-through decoration-muted/60">{MODEL_NAMES[labels[choice]]}</span>
                      <ArrowRightIcon className="size-4 text-muted" />
                    </>
                  )}
                  <ModelBadge model={actual[choice]} variant="solid" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-muted">
            {condition === "swap"
              ? "카드에 적힌 이름과 실제로 답변을 쓴 모델은 서로 바뀌어 있었어요."
              : "카드에 적힌 이름은 실제로 답변을 쓴 모델과 같았어요."}
          </p>
        </Card>

        <Card title="내 선택">
          <div className="grid grid-cols-2 gap-2">
            <StatTile label={<>‘{MODEL_NAMES.opus}’라고 적힌 답변</>} value={stats.labelOpus} total={stats.total} />
            <StatTile label={<>실제로 Opus 5.5가 쓴 답변</>} value={stats.actualOpus} total={stats.total} emphasis />
          </div>
          <p className="mt-3 rounded-2xl bg-accent-soft p-4 text-[14px] leading-relaxed text-ink">{insight(stats, condition)}</p>
        </Card>

        <Card title="라운드별로 보면">
          <RoundMatrix stats={stats} />
          <div className="mt-4">
            <Legend />
          </div>
        </Card>

        <Card title="점수도 이름을 따라갔을까요?">
          <RatingBars stats={stats} />
          <p className="mt-4 text-[12px] leading-relaxed text-muted">
            ‘{MODEL_NAMES[labels.A]}’ 카드에는 {MODEL_NAMES[actual.A]}의 답변이, ‘{MODEL_NAMES[labels.B]}’ 카드에는{" "}
            {MODEL_NAMES[actual.B]}의 답변이 들어 있었어요.
          </p>
        </Card>

        <p className="px-1 pt-3 text-[14px] leading-relaxed text-ink-2">
          정답이나 오답은 없어요. 모델 이름은 누구에게나 영향을 줘요. 참여해 주셔서 감사합니다.
        </p>
      </div>
    </ScreenShell>
  );
}
