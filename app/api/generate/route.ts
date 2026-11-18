import Anthropic from "@anthropic-ai/sdk";
import { RefusalError, liveAnswers } from "@/lib/generation/claude";
import { isRateLimited, isSameOrigin } from "@/lib/generation/guard";
import { mockAnswers } from "@/lib/generation/mock";
import {
  MAX_QUESTION_CHARS,
  MIN_QUESTION_CHARS,
  type GenerateErrorResponse,
  type GenerateResponse,
  type GenerationSource,
} from "@/lib/generation/shared";

// GENERATION_MODE=live|mock 로 고정할 수 있다. 지정하지 않으면 API 키가 있을 때만 실제 모델을 부른다.
function generationMode(): GenerationSource {
  const mode = process.env.GENERATION_MODE;
  if (mode === "live" || mode === "mock") return mode;
  return process.env.ANTHROPIC_API_KEY ? "live" : "mock";
}

function errorResponse(error: string, status: number) {
  return Response.json({ error } satisfies GenerateErrorResponse, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("허용되지 않은 요청이에요.", 403);
  if (isRateLimited(request)) {
    return errorResponse("요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", 429);
  }

  let question = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "question" in body && typeof body.question === "string") {
      question = body.question.trim();
    }
  } catch {
    return errorResponse("잘못된 요청이에요.", 400);
  }

  if (question.length < MIN_QUESTION_CHARS || question.length > MAX_QUESTION_CHARS) {
    return errorResponse(`질문은 ${MIN_QUESTION_CHARS}~${MAX_QUESTION_CHARS}자로 입력해 주세요.`, 400);
  }

  const source = generationMode();
  // 실제 수집(프로덕션)에서 키가 빠져 가짜 답변이 조용히 섞이면 데이터가 망가지므로 막는다.
  // 일부러 가짜 답변을 쓰려면 GENERATION_MODE=mock 을 명시한다.
  if (source === "mock" && process.env.VERCEL_ENV === "production" && process.env.GENERATION_MODE !== "mock") {
    console.error("[generate] 프로덕션에 ANTHROPIC_API_KEY가 없습니다");
    return errorResponse("지금은 답변을 만들 수 없어요. 진행자에게 알려 주세요.", 503);
  }
  try {
    const answers = source === "live" ? await liveAnswers(question) : mockAnswers(question);
    return Response.json({ answers, source } satisfies GenerateResponse);
  } catch (error) {
    if (error instanceof RefusalError) {
      return errorResponse("이 질문에는 답변을 만들 수 없어요. 다른 질문으로 바꿔 주세요.", 422);
    }
    console.error("[generate]", error);
    if (error instanceof Anthropic.RateLimitError) {
      return errorResponse("요청이 많아 잠시 지연되고 있어요. 조금 뒤 다시 시도해 주세요.", 429);
    }
    if (error instanceof Anthropic.APIError) {
      return errorResponse("답변을 받아오지 못했어요. 다시 시도해 주세요.", 502);
    }
    return errorResponse("알 수 없는 오류가 발생했어요. 다시 시도해 주세요.", 500);
  }
}
