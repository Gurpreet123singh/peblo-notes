"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  async function login() {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.15),transparent_40%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_30%)]" />

        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <h1 className="text-3xl font-bold">
          Login
        </h1>

        <input
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="Email"
          className="mt-6 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none"
        />

        <input
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="Password"
          type="password"
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none"
        />

        <button
          onClick={login}
          className="mt-4 w-full rounded-2xl bg-white py-3 font-semibold text-black shadow-lg shadow-white/10 transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-white/20 active:translate-y-0"
        >
          Login
        </button>

        {message && (
          <p className="mt-4 text-sm text-red-300">
            {message}
          </p>
        )}

        <p className="mt-5 text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-white underline"
          >
            Signup
          </Link>
        </p>
      </div>
    </main>
    
  );
}