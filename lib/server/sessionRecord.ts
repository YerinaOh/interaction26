// Blob에 저장하는 세션 스냅샷 한 건의 형태. 분석 스크립트도 이 타입을 읽는다.

import type { Assignment } from "@/lib/experiment/assignment";
import type { IntegrityReport } from "@/lib/experiment/integrity";
import type { ExperimentData } from "@/lib/experiment/types";
import type { EncryptedBlob } from "./pii";

export const SESSION_PREFIX = "sessions/";

export interface StoredSession {
  schema: 1;
  receivedAt: string;
  seq: number;
  screen: string;
  sentAt: string;
  assignment: Assignment;
  integrity: IntegrityReport;
  participantEncrypted: EncryptedBlob | null; // 학번·이름 (PARTICIPANT_KEY로 암호화)
  data: Omit<ExperimentData, "participant">; // 평문 데이터에는 학번·이름이 없다
}

// sessions/{sessionId}/{seq 3자리}-{ms}.json — 세션별로 seq가 가장 큰 파일이 최종본
export function snapshotPath(sessionId: string, seq: number, now: number): string {
  return `${SESSION_PREFIX}${sessionId}/${String(seq).padStart(3, "0")}-${now}.json`;
}
