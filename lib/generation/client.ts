import type { GenerateErrorResponse, GenerateRequest, GenerateResponse } from "./shared";

export class GenerateError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function requestAnswers(question: string, signal: AbortSignal): Promise<GenerateResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question } satisfies GenerateRequest),
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as GenerateErrorResponse | null;
    throw new GenerateError(body?.error ?? "답변을 받아오지 못했어요. 다시 시도해 주세요.", response.status);
  }
  return (await response.json()) as GenerateResponse;
}

export function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}
