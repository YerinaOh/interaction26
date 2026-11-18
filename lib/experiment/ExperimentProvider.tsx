"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isAssignment, isCondition } from "./assignment";
import { STEPS, type Step } from "./steps";
import { sendSnapshot } from "./sync";
import { createInitialState, type ExperimentData, type ExperimentState } from "./types";

// 저장 데이터 구조가 바뀌면 버전을 올려 이전 형식을 무시한다
const STORAGE_KEY = "halo-experiment:v5";

interface ExperimentContextValue {
  step: Step;
  stepIndex: number;
  totalSteps: number;
  data: ExperimentData;
  next: () => void;
  back: () => void;
  updateData: (updater: (data: ExperimentData) => ExperimentData) => void;
  reset: () => void;
}

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

// 테스트용 URL 파라미터
//   ?condition=match|swap  조건을 고정한 새 세션 (forced=true로 기록돼 분석에서 빠진다)
//   ?new=1                 저장된 진행을 버리고 새 세션 (무작위 배정)
function readUrlOverrides() {
  const params = new URLSearchParams(window.location.search);
  const condition = params.get("condition");
  return {
    forcedCondition: isCondition(condition) ? condition : undefined,
    fresh: params.has("new") || isCondition(condition),
  };
}

// 파라미터는 한 번만 적용한다. 그대로 두면 새로고침할 때마다 세션이 새로 시작된다.
function stripUrlOverrides() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("condition") && !url.searchParams.has("new")) return;
  url.searchParams.delete("condition");
  url.searchParams.delete("new");
  window.history.replaceState(null, "", url);
}

export function loadState(): ExperimentState {
  const { forcedCondition, fresh } = readUrlOverrides();
  stripUrlOverrides();
  if (fresh) return createInitialState(forcedCondition);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as ExperimentState;
    // 흐름이 바뀌어 저장된 인덱스가 범위를 벗어나거나 배정 정보가 없으면 처음부터 시작
    if (
      typeof parsed.stepIndex !== "number" ||
      parsed.stepIndex < 0 ||
      parsed.stepIndex >= STEPS.length ||
      !isAssignment(parsed.data?.assignment)
    ) {
      return createInitialState();
    }
    const initial = createInitialState();
    return { ...initial, ...parsed, data: { ...initial.data, ...parsed.data } };
  } catch {
    return createInitialState();
  }
}

function saveState(state: ExperimentState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 시크릿 모드 등에서 저장이 막혀도 실험 진행은 계속된다
  }
}

export function ExperimentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExperimentState | null>(null);

  // localStorage·URL은 브라우저에만 있으므로 마운트 후에 복원·배정한다.
  // 개발 모드에서 effect가 두 번 돌아도 배정은 한 번만 뽑도록 ref에 담아 둔다.
  const loaded = useRef<ExperimentState | null>(null);
  useEffect(() => {
    loaded.current ??= loadState();
    setState(loaded.current);
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  // 단계가 바뀔 때마다 서버에 스냅샷을 보낸다. 동의(M-01)를 마친 뒤부터만 보낸다.
  const lastSent = useRef<string | null>(null);
  useEffect(() => {
    if (!state || state.stepIndex < 1) return;
    const key = `${state.data.assignment.sessionId}:${state.stepIndex}`;
    if (lastSent.current === key) return;
    lastSent.current = key;
    sendSnapshot({
      seq: state.stepIndex,
      screen: STEPS[state.stepIndex].screen,
      sentAt: new Date().toISOString(),
      data: state.data,
    });
  }, [state]);

  const next = useCallback(() => {
    setState((s) => s && { ...s, stepIndex: Math.min(s.stepIndex + 1, STEPS.length - 1) });
  }, []);

  // 생성 실패 시 질문을 고치러 M-05로 돌아갈 때만 쓴다
  const back = useCallback(() => {
    setState((s) => s && { ...s, stepIndex: Math.max(s.stepIndex - 1, 0) });
  }, []);

  const updateData = useCallback((updater: (data: ExperimentData) => ExperimentData) => {
    setState((s) => s && { ...s, data: updater(s.data) });
  }, []);

  const reset = useCallback(() => setState(createInitialState()), []);

  const value = useMemo<ExperimentContextValue | null>(
    () =>
      state && {
        step: STEPS[state.stepIndex],
        stepIndex: state.stepIndex,
        totalSteps: STEPS.length,
        data: state.data,
        next,
        back,
        updateData,
        reset,
      },
    [state, next, back, updateData, reset],
  );

  // 복원 전에 첫 화면을 잠깐 보여주는 깜빡임을 막는다
  if (!value) return null;

  return <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>;
}

export function useExperiment() {
  const ctx = useContext(ExperimentContext);
  if (!ctx) throw new Error("useExperiment must be used within ExperimentProvider");
  return ctx;
}
