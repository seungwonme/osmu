"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Header() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/auth");
  };

  return (
    <header className="w-full flex justify-between items-center px-6 py-4 border-b bg-white/80 sticky top-0 z-10">
      <a href="/" className="font-bold text-xl text-blue-700">
        원소스 멀티유즈
      </a>
      <nav>
        {user ? (
          <button className="btn" onClick={handleLogout}>
            로그아웃
          </button>
        ) : (
          <a href="/auth" className="btn">
            로그인/회원가입
          </a>
        )}
      </nav>
    </header>
  );
}
