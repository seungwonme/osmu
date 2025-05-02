"use server";

import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

export async function getYoutubeTranscript(url: string) {
  try {
    if (!url || !url.startsWith("http")) {
      throw new Error("유효하지 않은 유튜브 링크입니다.");
    }
    const loader = YoutubeLoader.createFromUrl(url, {
      language: "ko",
      addVideoInfo: true,
    });
    const docs = await loader.load();
    if (!docs || docs.length === 0) {
      throw new Error("자막을 찾을 수 없습니다.");
    }
    const transcript = docs.map((doc: any) => doc.pageContent).join("\n\n");
    return { transcript };
  } catch (err: any) {
    return { error: err.message || "알 수 없는 오류가 발생했습니다." };
  }
}
