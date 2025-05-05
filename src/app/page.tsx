"use client";

import { useState, useTransition, useEffect } from "react";
import { getYoutubeTranscript } from "./actions/getYoutubeTranscript";
import { generatePostFromTranscript } from "./actions/generatePostFromTranscript";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

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
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsMember(!!data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsMember(!!session?.user);
      },
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

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
      if (isMember) {
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
            [threadResult.error, linkedinResult.error]
              .filter(Boolean)
              .join("\n"),
          );
        }
      } else {
        setThreadPost(null);
        setLinkedinPost(null);
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
    <main className="flex flex-col items-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
      <section className="w-full max-w-3xl mb-10 text-center mt-12 md:mt-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 dark:text-blue-400 mb-3 tracking-tight drop-shadow-lg">
          원소스 멀티유즈
        </h1>
        <p className="mb-6 text-lg md:text-xl text-gray-700 dark:text-gray-200 font-medium">
          유튜브 자막을 입력하면{" "}
          <span className="text-blue-600 dark:text-blue-300 font-bold">
            스레드/링크드인
          </span>{" "}
          스타일의 글을 AI가 자동으로 만들어줍니다.
        </p>
      </section>
      <section className="w-full max-w-2xl flex flex-col md:flex-row gap-8 mb-10">
        <form
          onSubmit={handleSubmit}
          className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col gap-4 border border-blue-100 dark:border-gray-800 hover:shadow-2xl transition-shadow"
        >
          <label
            htmlFor="youtube-url"
            className="font-semibold text-left text-gray-700 dark:text-gray-200 text-base mb-1"
          >
            유튜브 링크를 입력하세요
          </label>
          <input
            id="youtube-url"
            type="url"
            value={youtubeUrl}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input text-base px-4 py-3 border-2 border-blue-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg transition-all outline-none bg-blue-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            required
            autoFocus
          />
          <button
            type="submit"
            className="btn mt-2 w-full py-3 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg rounded-lg transition-all disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>{" "}
                불러오는 중...
              </span>
            ) : (
              "확인"
            )}
          </button>
          {error && (
            <div className="text-red-500 text-sm mt-2 whitespace-pre-line bg-red-50 dark:bg-red-900/30 rounded p-2 border border-red-200 dark:border-red-700">
              {error}
            </div>
          )}
        </form>
        {youtubeUrl && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="aspect-video w-full max-w-xl rounded-2xl overflow-hidden shadow-lg border border-blue-100 dark:border-gray-800 bg-black">
              <iframe
                src={getYoutubeEmbedUrl(youtubeUrl)}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full min-h-[200px]"
              />
            </div>
          </div>
        )}
      </section>
      <section className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mb-32">
        {/* 자막 영역 */}
        <div className="flex-1">
          {transcript && (
            <div className="whitespace-pre-wrap card p-6 mb-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-800">
              <h2 className="font-bold mb-3 text-xl text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 dark:text-blue-200">
                  subtitles
                </span>{" "}
                자막
              </h2>
              <div className="text-gray-800 dark:text-gray-100 leading-relaxed text-base">
                {transcript}
              </div>
            </div>
          )}
        </div>
        {/* 스레드/링크드인 탭 영역 */}
        {isMember && (threadPost || linkedinPost) && (
          <div className="flex-1">
            <div className="card p-0 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-800">
              <div className="flex border-b border-blue-100 dark:border-gray-800">
                <button
                  className={`flex-1 py-3 font-semibold rounded-tl-lg text-lg transition-colors ${
                    tab === "thread"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setTab("thread")}
                  type="button"
                >
                  스레드용 글
                </button>
                <button
                  className={`flex-1 py-3 font-semibold rounded-tr-lg text-lg transition-colors ${
                    tab === "linkedin"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setTab("linkedin")}
                  type="button"
                >
                  링크드인용 글
                </button>
              </div>
              <div className="p-6 min-h-[200px]">
                {tab === "thread" && threadPost && (
                  <div className="flex flex-col gap-4">
                    {splitThreadPosts(threadPost).map((item, idx) => (
                      <div
                        key={idx}
                        className="relative bg-blue-50 dark:bg-blue-950 rounded-lg p-4 shadow flex items-start card border border-blue-100 dark:border-blue-800"
                      >
                        <span className="flex-1 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                          {item}
                        </span>
                        <button
                          className="ml-2 px-3 py-1 text-xs btn bg-blue-500 hover:bg-blue-700 text-white rounded transition-all shadow"
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
                  <div className="relative bg-green-50 dark:bg-green-950 rounded-lg p-4 shadow card border border-green-100 dark:border-green-800">
                    <span className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                      {linkedinPost}
                    </span>
                    <button
                      className="absolute top-2 right-2 px-3 py-1 text-xs btn bg-green-500 hover:bg-green-700 text-white rounded transition-all shadow"
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
      </section>
      {!isMember && (
        <div className="flex-1 flex flex-col items-center justify-center fixed bottom-0 left-0 right-0">
          <div className="flex flex-col items-center justify-center text-gray-500 text-center mb-4 bg-white dark:bg-gray-900 rounded-xl p-6 border border-blue-100 dark:border-gray-800 shadow min-h-[180px]">
            <span className="text-lg font-semibold">
              요약(스레드/링크드인) 기능은{" "}
              <span className="text-blue-600 dark:text-blue-300">회원만</span>{" "}
              사용할 수 있습니다.
            </span>
            <br />
            <a
              href="/auth"
              className="text-blue-600 dark:text-blue-300 underline font-bold hover:text-blue-800 dark:hover:text-blue-400 transition-colors mt-2"
            >
              로그인/회원가입 하러가기
            </a>
          </div>
        </div>
      )}
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
