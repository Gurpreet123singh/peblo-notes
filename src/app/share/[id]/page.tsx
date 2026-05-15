import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SharedNotePage({ params }: Props) {
  const { id } = await params;

  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("share_id", id)
    .single();

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent text-white">
        <h1 className="text-3xl font-bold">Note not found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-6 py-20 text-white">
      <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm uppercase tracking-wide text-zinc-400">
          Shared Peblo Note
        </p>

        <h1 className="mt-4 text-4xl font-bold">{data.title}</h1>

        <p className="mt-6 whitespace-pre-wrap leading-7 text-zinc-300">
          {data.content}
        </p>
      </article>
    </main>
  );
}