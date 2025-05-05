"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const supabase = createSupabaseBrowserClient();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/auth");
  };

  return (
    <header
      className={`w-full flex justify-between items-center px-6 py-4 border-b transition-all duration-300 sticky top-0 z-20
        ${
          scrolled
            ? "bg-white/80 dark:bg-gray-950/80 shadow-sm border-blue-100 dark:border-gray-800 backdrop-blur-md"
            : "bg-transparent border-blue-50 dark:border-gray-900"
        }
      `}
      style={{ minHeight: 72 }}
    >
      <Link
        href="/"
        className="font-extrabold text-2xl md:text-3xl text-blue-700 dark:text-blue-300 tracking-tight flex items-center gap-2 hover:scale-105 transition-transform"
      >
        <span className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 text-white dark:text-white px-3 py-1 rounded-lg shadow mr-2 text-lg md:text-xl">
          Osmu
        </span>
        <span className="hidden md:inline-block">원소스 멀티유즈</span>
      </Link>
      <nav>
        {user ? (
          <button
            className="btn bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold px-6 py-2 rounded-lg shadow transition-all border-none"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        ) : (
          <Link
            href="/auth"
            className="btn bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-800 text-white font-bold px-6 py-2 rounded-lg shadow transition-all border-none"
          >
            로그인/회원가입
          </Link>
        )}
      </nav>
    </header>
  );
}
