// Blob에 쌓인 참가자 세션을 내려받아 분석용 CSV로 만든다.
//
//   npm run export:sessions                    완료한 세션만, 테스트(?condition=) 세션 제외
//   npm run export:sessions -- --all           중도 이탈 세션도 포함
//   npm run export:sessions -- --include-forced  테스트 세션도 포함
//   npm run export:sessions -- --with-pii      학번·이름 복호화 파일도 따로 만든다 (PARTICIPANT_KEY 필요)
//
// 인증: .env.local 에 BLOB_READ_WRITE_TOKEN (또는 `vercel env pull` 로 받은 OIDC 토큰 + BLOB_STORE_ID)
// 결과: reports/export-YYYYMMDD-HHMM/ 아래 rounds.csv, participants.csv, sessions.json (+ pii.csv)

import { mkdirSync, writeFileSync } from "node:fs";
import { get, list } from "@vercel/blob";
import { slotMapping } from "@/lib/experiment/assignment";
import { checkRounds } from "@/lib/experiment/integrity";
import type { ModelId } from "@/lib/experiment/models";
import type { Choice, RoundRecord } from "@/lib/experiment/types";
import { decryptJson } from "@/lib/server/pii";
import { SESSION_PREFIX, type StoredSession } from "@/lib/server/sessionRecord";

const args = process.argv.slice(2);
const INCLUDE_INCOMPLETE = args.includes("--all");
const INCLUDE_FORCED = args.includes("--include-forced");
const WITH_PII = args.includes("--with-pii");

if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
  console.error(`❌ Blob 저장소 인증 정보가 없어요.
.env.local 에 BLOB_READ_WRITE_TOKEN 을 넣거나, \`vercel env pull .env.local\` 로 받아 주세요.`);
  process.exit(1);
}

// ── 1. 세션별 최신 스냅샷 찾기 ─────────────────────────────────────────
async function latestPathnames(): Promise<Map<string, string>> {
  const latest = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: SESSION_PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const [, sessionId] = blob.pathname.split("/");
      const prev = latest.get(sessionId);
      // 파일명이 {seq 3자리}-{ms}.json 이라 문자열 비교로 최신을 고를 수 있다
      if (!prev || blob.pathname > prev) latest.set(sessionId, blob.pathname);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return latest;
}

async function download(pathname: string): Promise<StoredSession> {
  const res = await get(pathname, { access: "private" });
  if (!res || res.statusCode !== 200) throw new Error(`다운로드 실패: ${pathname}`);
  return JSON.parse(await new Response(res.stream).text()) as StoredSession;
}

// ── 2. CSV 도우미 ───────────────────────────────────────────────────
type Cell = string | number | boolean | null | undefined;
function csv(rows: Record<string, Cell>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: Cell) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "boolean" ? (v ? "1" : "0") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // 엑셀에서 한글이 깨지지 않도록 BOM을 붙인다
  return "﻿" + [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

const slotOf = (map: Record<Choice, ModelId>, model: ModelId): Choice => (map.A === model ? "A" : "B");

// ── 3. 실행 ─────────────────────────────────────────────────────────
const paths = await latestPathnames();
console.log(`세션 ${paths.size}개 발견, 내려받는 중…`);
const sessions = await Promise.all([...paths.values()].map(download));

const included = sessions.filter(
  (s) => (INCLUDE_INCOMPLETE || s.data.completedAt) && (INCLUDE_FORCED || !s.assignment.forced),
);

const roundRows: Record<string, Cell>[] = [];
const participantRows: Record<string, Cell>[] = [];
const piiRows: Record<string, Cell>[] = [];
let integrityFailures = 0;

for (const s of included) {
  const a = s.assignment;
  const rounds = s.data.rounds as RoundRecord[];
  // 저장할 때 검사했어도 내보낼 때 다시 확인한다
  const integrity = checkRounds(a, rounds);
  if (!integrity.ok) integrityFailures++;
  const { labels, actual } = slotMapping(a);
  const base = {
    session_id: a.sessionId,
    condition: a.condition,
    opus_label_slot: a.opusLabelSlot,
    forced: a.forced,
    completed: Boolean(s.data.completedAt),
  };

  for (const r of rounds) {
    const opusLabelSlot = slotOf(labels, "opus");
    const haikuLabelSlot = slotOf(labels, "haiku");
    const opusActualSlot = slotOf(actual, "opus");
    const haikuActualSlot = slotOf(actual, "haiku");
    roundRows.push({
      ...base,
      part: r.part,
      round: r.round,
      task_id: r.taskId,
      task_type: r.taskType,
      choice: r.choice,
      chosen_label: r.chosenLabel,
      chosen_actual: r.chosenActual,
      chose_opus_label: r.chosenLabel === "opus",
      chose_opus_actual: r.chosenActual === "opus",
      chosen_label_correct: r.chosenLabel === r.chosenActual,
      decision_ms: r.decisionMs,
      quality_opus_label: r.ratings[opusLabelSlot]?.quality,
      trust_opus_label: r.ratings[opusLabelSlot]?.trust,
      quality_haiku_label: r.ratings[haikuLabelSlot]?.quality,
      trust_haiku_label: r.ratings[haikuLabelSlot]?.trust,
      quality_opus_actual: r.ratings[opusActualSlot]?.quality,
      trust_opus_actual: r.ratings[opusActualSlot]?.trust,
      quality_haiku_actual: r.ratings[haikuActualSlot]?.quality,
      trust_haiku_actual: r.ratings[haikuActualSlot]?.trust,
      integrity_ok: integrity.ok,
    });
  }

  // 중도 이탈·구버전 기록은 일부 필드가 없을 수 있다
  const pre: Partial<typeof s.data.preSurvey> = s.data.preSurvey ?? {};
  const fin: Partial<typeof s.data.finalCheck> = s.data.finalCheck ?? {};
  const post: Partial<typeof s.data.postSurvey> = s.data.postSurvey ?? {};
  participantRows.push({
    ...base,
    last_screen: s.screen,
    assigned_at: a.assignedAt,
    revealed_at: s.data.revealedAt,
    completed_at: s.data.completedAt,
    n_rounds: rounds.length,
    n_chose_opus_label: rounds.filter((r) => r.chosenLabel === "opus").length,
    n_chose_opus_actual: rounds.filter((r) => r.chosenActual === "opus").length,
    frequency: pre.frequency,
    purposes: pre.purposes?.join("|"),
    paid_subscription: pre.paidSubscription,
    perceived_difference: pre.perceivedDifference,
    early_adopter: pre.earlyAdopter,
    name_influence: fin.nameInfluence,
    reflection: fin.reflection,
    post_criteria: post.criteria?.join("|"),
    trust_change: post.trustChange,
    comment: post.comment,
    part2_source: (s.data.part2 ?? []).map((p) => p.source ?? "").join("|"),
    integrity_ok: integrity.ok,
    integrity_issues: integrity.issues.join(" / "),
  });

  if (WITH_PII) {
    const secret = process.env.PARTICIPANT_KEY;
    if (!secret) {
      console.error("❌ --with-pii 에는 PARTICIPANT_KEY 가 필요해요.");
      process.exit(1);
    }
    const p = s.participantEncrypted ? decryptJson<{ studentId: string; name: string }>(s.participantEncrypted, secret) : null;
    piiRows.push({ session_id: a.sessionId, student_id: p?.studentId, name: p?.name, completed: base.completed });
  }
}

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
const outDir = `reports/export-${stamp}`;
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/rounds.csv`, csv(roundRows));
writeFileSync(`${outDir}/participants.csv`, csv(participantRows));
// 원본 JSON에도 학번·이름은 암호문으로만 남는다
writeFileSync(`${outDir}/sessions.json`, JSON.stringify(included, null, 2));
if (WITH_PII) writeFileSync(`${outDir}/pii.csv`, csv(piiRows));

// ── 4. 조건별 요약 ──────────────────────────────────────────────────
const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "–");
const mean = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "–";
};

console.log(`\n포함 ${included.length}개 / 전체 ${sessions.length}개 세션 (완료만=${!INCLUDE_INCOMPLETE}, 테스트 제외=${!INCLUDE_FORCED})`);
console.log(`라벨 무결성 실패 세션: ${integrityFailures}개${integrityFailures ? "  ⚠️ participants.csv 의 integrity_issues 확인" : ""}\n`);

for (const condition of ["match", "swap"] as const) {
  const ps = participantRows.filter((p) => p.condition === condition);
  const rs = roundRows.filter((r) => r.condition === condition);
  const slotA = ps.filter((p) => p.opus_label_slot === "A").length;
  console.log(`[${condition === "match" ? "정상 라벨 (match)" : "반전 라벨 (swap)"}]  참가자 ${ps.length}명 (Opus 라벨 A자리 ${slotA} / B자리 ${ps.length - slotA}), 라운드 ${rs.length}개`);
  console.log(`  'Opus' 라벨 카드 선택   ${pct(rs.filter((r) => r.chose_opus_label).length, rs.length)}`);
  console.log(`  실제 Opus 답변 선택     ${pct(rs.filter((r) => r.chose_opus_actual).length, rs.length)}`);
  console.log(`  평균 품질  Opus 라벨 ${mean(rs.map((r) => r.quality_opus_label as number))} / Haiku 라벨 ${mean(rs.map((r) => r.quality_haiku_label as number))}`);
  console.log(`  평균 신뢰  Opus 라벨 ${mean(rs.map((r) => r.trust_opus_label as number))} / Haiku 라벨 ${mean(rs.map((r) => r.trust_haiku_label as number))}\n`);
}

console.log(`→ ${outDir}/ 에 저장했어요. 라운드는 참가자 안에 묶여 있으니, 검정은 참가자 단위(혼합효과 로지스틱 등)로 하세요.`);
