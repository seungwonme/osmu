"use client";

import { useState, useTransition } from "react";
import { getYoutubeTranscript } from "./actions/getYoutubeTranscript";
import { generatePostFromTranscript } from "./actions/generatePostFromTranscript";

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  });
}

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [threadPost, setThreadPost] = useState<string | null>(null);
  const [linkedinPost, setLinkedinPost] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"thread" | "linkedin">("thread");
  const [copiedThreadIdx, setCopiedThreadIdx] = useState<number | null>(null);
  const [copiedLinkedin, setCopiedLinkedin] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTranscript(null);
    setThreadPost(null);
    setLinkedinPost(null);
    setError(null);
    startTransition(async () => {
      const transcriptResult = await getYoutubeTranscript(youtubeUrl);
      if (transcriptResult.error) {
        setTranscript(null);
        setThreadPost(null);
        setLinkedinPost(null);
        setError(transcriptResult.error);
        return;
      }
      setTranscript(transcriptResult.transcript ?? null);
      setError(null);
      const [threadResult, linkedinResult] = await Promise.all([
        generatePostFromTranscript({
          transcript: transcriptResult.transcript ?? "",
          type: "thread",
        }),
        generatePostFromTranscript({
          transcript: transcriptResult.transcript ?? "",
          type: "linkedin",
        }),
      ]);
      setThreadPost(
        typeof threadResult.post === "string"
          ? threadResult.post
          : threadResult.post
          ? JSON.stringify(threadResult.post)
          : null,
      );
      setLinkedinPost(
        typeof linkedinResult.post === "string"
          ? linkedinResult.post
          : linkedinResult.post
          ? JSON.stringify(linkedinResult.post)
          : null,
      );
      if (threadResult.error || linkedinResult.error) {
        setError(
          [threadResult.error, linkedinResult.error].filter(Boolean).join("\n"),
        );
      }
    });
  };

  // 스레드 글 분리 함수 (---SPLIT--- 기준)
  function splitThreadPosts(text: string): string[] {
    if (!text) return [];
    return text
      .split(/\n?---SPLIT---\n?/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-3xl mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-2">
          원소스 멀티유즈
        </h1>
        <p className="text-gray-700 mb-4">
          유튜브 자막을 입력하면 스레드/링크드인 스타일의 글을 AI가 자동으로
          만들어줍니다.
        </p>
      </div>
      {youtubeUrl && (
        <div className="w-full max-w-2xl mb-8 flex justify-center">
          <div className="aspect-video w-full max-w-xl rounded overflow-hidden shadow border card">
            <iframe
              src={getYoutubeEmbedUrl(youtubeUrl)}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 w-full max-w-xl card p-6 mb-8"
      >
        <label htmlFor="youtube-url" className="font-semibold text-left">
          유튜브 링크를 입력하세요
        </label>
        <input
          id="youtube-url"
          type="url"
          value={youtubeUrl}
          onChange={handleChange}
          placeholder="https://www.youtube.com/watch?v=..."
          className="input"
          required
        />
        <button type="submit" className="btn mt-2" disabled={isPending}>
          {isPending ? "불러오는 중..." : "확인"}
        </button>
      </form>
      <div className="flex flex-row gap-8 w-full max-w-5xl">
        {/* 자막 영역 */}
        <div className="flex-1">
          {error && (
            <div className="text-red-500 mb-4 whitespace-pre-line">{error}</div>
          )}
          {transcript && (
            <div className="whitespace-pre-wrap card p-4 mb-4">
              <h2 className="font-bold mb-2 text-gray-700">자막</h2>
              {transcript}
            </div>
          )}
        </div>
        {/* 스레드/링크드인 탭 영역 */}
        {(threadPost || linkedinPost) && (
          <div className="flex-1">
            <div className="card p-0">
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 font-semibold rounded-tl ${
                    tab === "thread"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                  onClick={() => setTab("thread")}
                  type="button"
                >
                  스레드용 글
                </button>
                <button
                  className={`flex-1 py-2 font-semibold rounded-tr ${
                    tab === "linkedin"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                  onClick={() => setTab("linkedin")}
                  type="button"
                >
                  링크드인용 글
                </button>
              </div>
              <div className="p-4 min-h-[200px]">
                {tab === "thread" && threadPost && (
                  <div className="flex flex-col gap-4">
                    {splitThreadPosts(threadPost).map((item, idx) => (
                      <div
                        key={idx}
                        className="relative bg-blue-50 rounded p-3 shadow flex items-start card"
                      >
                        <span className="flex-1 whitespace-pre-wrap">
                          {item}
                        </span>
                        <button
                          className="ml-2 px-2 py-1 text-xs btn"
                          onClick={() =>
                            copyToClipboard(item, (v) =>
                              setCopiedThreadIdx(v ? idx : null),
                            )
                          }
                          type="button"
                        >
                          {copiedThreadIdx === idx ? "복사됨" : "복사"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {tab === "linkedin" && linkedinPost && (
                  <div className="relative bg-green-50 rounded p-3 shadow card">
                    <span className="whitespace-pre-wrap">{linkedinPost}</span>
                    <button
                      className="absolute top-2 right-2 px-2 py-1 text-xs btn"
                      onClick={() =>
                        copyToClipboard(linkedinPost, setCopiedLinkedin)
                      }
                      type="button"
                    >
                      {copiedLinkedin ? "복사됨" : "복사"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function getYoutubeEmbedUrl(url: string): string {
  // https://www.youtube.com/watch?v=xxxx 또는 https://youtu.be/xxxx
  try {
    const ytMatch = url.match(
      /(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/))([\w-]{11})/,
    );
    const videoId = ytMatch ? ytMatch[1] : null;
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return "";
  } catch {
    return "";
  }
}
