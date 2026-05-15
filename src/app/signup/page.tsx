"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  async function signup() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Please check your email to confirm signup.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.15),transparent_40%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_30%)]" />
     <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <h1 className="text-3xl font-bold">Create account</h1>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mt-6 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none"
        />

        <button
          onClick={signup}
          className="mt-4 w-full rounded-2xl bg-white py-3 font-semibold text-black shadow-lg shadow-white/10 transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-white/20 active:translate-y-0"
        >
          Sign up
        </button>

        {message && (
          <p className="mt-4 text-sm text-zinc-300">{message}</p>
        )}

        <p className="mt-5 text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}