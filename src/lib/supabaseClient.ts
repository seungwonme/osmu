/* eslint-disable @typescript-eslint/no-explicit-any */

import { createBrowserClient, createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createSupabaseBrowserClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);

export const createSupabaseServerClient = (cookies: any) =>
  createServerClient(supabaseUrl, supabaseAnonKey, { cookies });
