import { put } from "@vercel/blob";
import { isAssignment } from "@/lib/experiment/assignment";
import { checkRounds } from "@/lib/experiment/integrity";
import { STEPS } from "@/lib/experiment/steps";
import type { RoundRecord } from "@/lib/experiment/types";
import { clientIp, createRateLimiter, isSameOrigin } from "@/lib/generation/guard";
import { encryptJson } from "@/lib/server/pii";
import { snapshotPath, type StoredSession } from "@/lib/server/sessionRecord";

// 참가자 진행 스냅샷을 Vercel Blob(private)에 쌓는다. 덮어쓰지 않고 매번 새 파일을 만든다.

const MAX_BODY_BYTES = 200_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 한 세션은 단계 수(~25)만큼만 보낸다. 강의실처럼 한 IP 뒤에 여러 명이 있을 수 있어 IP 한도는 넉넉히.
const perSession = createRateLimiter(10 * 60 * 1000, 120);
const perIp = createRateLimiter(10 * 60 * 1000, 3000);

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  if (perIp(clientIp(request))) return fail("rate limited", 429);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return fail("too large", 413);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return fail("bad json", 400);
  }

  const data = body.data as Record<string, unknown> | undefined;
  const assignment = data?.assignment;
  const seq = body.seq;
  if (
    !data ||
    !isAssignment(assignment) ||
    !UUID.test(assignment.sessionId) ||
    typeof seq !== "number" ||
    !Number.isInteger(seq) ||
    seq < 0 ||
    seq >= STEPS.length ||
    !Array.isArray(data.rounds)
  ) {
    return fail("bad payload", 400);
  }
  if (perSession(assignment.sessionId)) return fail("rate limited", 429);

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    console.error("[sessions] Blob 저장소가 연결되지 않았습니다 (BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID 없음)");
    return fail("storage not configured", 503);
  }

  const { participant, ...rest } = data;
  const secret = process.env.PARTICIPANT_KEY;
  if (!secret && participant) console.warn("[sessions] PARTICIPANT_KEY가 없어 학번·이름을 저장하지 않습니다");

  const now = Date.now();
  const record: StoredSession = {
    schema: 1,
    receivedAt: new Date(now).toISOString(),
    seq,
    screen: typeof body.screen === "string" ? body.screen : STEPS[seq].screen,
    sentAt: typeof body.sentAt === "string" ? body.sentAt : "",
    assignment,
    integrity: checkRounds(assignment, data.rounds as RoundRecord[]),
    participantEncrypted: secret && participant ? encryptJson(participant, secret) : null,
    data: rest as StoredSession["data"],
  };

  if (!record.integrity.ok) console.warn("[sessions] 라벨 무결성 경고", assignment.sessionId, record.integrity.issues);

  try {
    await put(snapshotPath(assignment.sessionId, seq, now), JSON.stringify(record), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error("[sessions] 저장 실패", error);
    return fail("store failed", 502);
  }

  return Response.json({ ok: true, integrity: record.integrity.ok });
}
