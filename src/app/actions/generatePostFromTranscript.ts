"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const SYSTEM_PROMPT = {
  thread: `너는 트위터(스레드) 스타일의 글을 작성하는 AI야. 유튜브 자막을 바탕으로 핵심 내용을 짧고 임팩트 있게, 여러 개의 트윗(스레드)으로 나눠줘. 각 트윗은 280자 이내로 해줘. 너무 딱딱하지 않게, 대화체와 해시태그도 적절히 섞어줘.\n\n절대 마크다운 문법(예: #, *, -, 1. 등)을 사용하지 말고, 순수 텍스트로만 작성해줘.\n각 트윗(스레드) 사이에는 반드시 ---SPLIT--- 이라는 구분자를 한 줄로 넣어줘. (예시: 트윗1 내용...\n---SPLIT---\n트윗2 내용...\n---SPLIT---)`,
  linkedin: `너는 링크드인 스타일의 글을 작성하는 AI야. 유튜브 자막을 바탕으로 전문적이고 신뢰감 있게, 인사이트와 배움을 강조하는 게시글을 작성해줘. 너무 가볍지 않게, 적절한 이모지와 해시태그도 활용해줘.\n\n절대 마크다운 문법(예: #, *, -, 1. 등)을 사용하지 말고, 순수 텍스트로만 작성해줘.`,
};

export async function generatePostFromTranscript({
  transcript,
  type,
}: {
  transcript: string;
  type: "thread" | "linkedin";
}) {
  try {
    if (!transcript || !type) {
      throw new Error("자막과 타입이 모두 필요합니다.");
    }
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-preview-04-17",
      apiKey: process.env.GEMINI_API_KEY,
    });
    const messages = [
      { role: "system", content: SYSTEM_PROMPT[type] },
      { role: "user", content: `[유튜브 자막]\n${transcript}` },
    ];
    const result = await model.invoke(messages);
    if (!result) {
      throw new Error("Gemini API로부터 결과를 받지 못했습니다.");
    }
    return { post: result.content };
  } catch (err: any) {
    return { error: err.message || "알 수 없는 오류가 발생했습니다." };
  }
}
