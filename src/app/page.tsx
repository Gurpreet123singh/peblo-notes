"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Note = {
  id: number;
  title: string;
  content: string;
  share_id: string;
  tags: string[];
  ai_generated_count: number;
  archived?: boolean;
  created_at?: string;
};

export default function Home() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [search, setSearch] = useState("");

  const [editingNoteId, setEditingNoteId] =
    useState<number | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);

  const [aiSummary, setAiSummary] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadingNoteId, setLoadingNoteId] =
    useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  // =========================
  // MEMOIZED ANALYTICS
  // =========================

  const totalNotes = notes.length;

  const totalTags = useMemo(() => {
    return notes.reduce(
      (acc, note) => acc + (note.tags?.length || 0),
      0
    );
  }, [notes]);

  const totalAiUsage = useMemo(() => {
    return notes.reduce(
      (acc, note) =>
        acc + (note.ai_generated_count || 0),
      0
    );
  }, [notes]);

  const mostUsedTag = useMemo(() => {
    const tagMap: Record<string, number> = {};

    notes.forEach((note) => {
      note.tags?.forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(tagMap).sort(
      (a, b) => b[1] - a[1]
    );

    return sortedTags[0]?.[0] || "No tags";
  }, [notes]);

  const recentlyEdited = useMemo(() => {
    return [...notes].slice(0, 3);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const keyword = search.toLowerCase();

    return notes.filter((note) => {
      return (
        note.title
          .toLowerCase()
          .includes(keyword) ||
        note.content
          .toLowerCase()
          .includes(keyword) ||
        note.tags?.some((tag) =>
          tag.toLowerCase().includes(keyword)
        )
      );
    });
  }, [notes, search]);

  // =========================
  // FETCH NOTES
  // =========================

  async function fetchNotes() {
    setLoading(true);

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("archived", false)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    }

    if (data) {
      setNotes(data);
    }

    setLoading(false);
  }

  // =========================
  // SAVE NOTE
  // =========================

  async function saveNote() {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required.");
      return;
    }

    setSaving(true);

    const formattedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      if (editingNoteId) {
        const { error } = await supabase
          .from("notes")
          .update({
            title,
            content,
            tags: formattedTags,
          })
          .eq("id", editingNoteId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notes")
          .insert([
            {
              title,
              content,
              tags: formattedTags,
            },
          ]);

        if (error) throw error;
      }

      resetForm();
      fetchNotes();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }

    setSaving(false);
  }

  // =========================
  // RESET FORM
  // =========================

  function resetForm() {
    setTitle("");
    setContent("");
    setTags("");
    setEditingNoteId(null);
  }

  // =========================
  // EDIT NOTE
  // =========================

  function startEditing(note: Note) {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.join(", ") || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // DELETE NOTE
  // =========================

  async function deleteNote(noteId: number) {
    const confirmed = window.confirm(
      "Delete this note permanently?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      console.error(error);
      return;
    }

    fetchNotes();
  }

  // =========================
  // ARCHIVE NOTE
  // =========================

  async function archiveNote(noteId: number) {
    const { error } = await supabase
      .from("notes")
      .update({
        archived: true,
      })
      .eq("id", noteId);

    if (error) {
      console.error(error);
      return;
    }

    fetchNotes();
  }

  // =========================
  // LOGOUT
  // =========================

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // =========================
  // AI SUMMARY
  // =========================

  async function generateAiSummary(
    noteId: number,
    noteContent: string
  ) {
    setLoadingNoteId(noteId);
    setAiSummary("");

    try {
      const response = await fetch(
        "/api/generate-summary",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            content: noteContent,
          }),
        }
      );

      const data = await response.json();

      setAiSummary(
        data.summary ||
          data.error ||
          "No summary generated."
      );

      const currentNote = notes.find(
        (note) => note.id === noteId
      );

      await supabase
        .from("notes")
        .update({
          ai_generated_count:
            (currentNote?.ai_generated_count || 0) + 1,
        })
        .eq("id", noteId);

      fetchNotes();
    } catch (error) {
      console.error(error);
      setAiSummary("AI generation failed.");
    }

    setLoadingNoteId(null);
  }

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      fetchNotes();
    }

    checkUser();
  }, []);

  // =========================
  // UI
  // =========================

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl p-6">

        {/* HEADER */}

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-5xl font-black tracking-tight">
              Peblo Notes
            </h1>

            <p className="mt-2 text-zinc-400">
              AI-powered collaborative notes dashboard
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:scale-105 hover:bg-red-500/20"
          >
            Logout
          </button>
        </div>

        {/* STATS */}

        <div className="mt-10 grid gap-5 md:grid-cols-4">

          <StatCard
            title="Total Notes"
            value={totalNotes}
          />

          <StatCard
            title="Total Tags"
            value={totalTags}
          />

          <StatCard
            title="Most Used Tag"
            value={`#${mostUsedTag}`}
          />

          <StatCard
            title="AI Generations"
            value={totalAiUsage}
          />
        </div>

        {/* RECENT */}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Recently Edited
            </h2>

            <span className="text-sm text-zinc-500">
              Latest activity
            </span>
          </div>

          <div className="mt-5 space-y-4">

            {recentlyEdited.length === 0 ? (
              <p className="text-zinc-500">
                No recent notes.
              </p>
            ) : (
              recentlyEdited.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-5 py-4 transition hover:border-white/20"
                >
                  <div>
                    <h3 className="font-semibold">
                      {note.title}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      Recently updated
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      startEditing(note)
                    }
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
                  >
                    Open
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN GRID */}

        <div className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]">

          {/* FORM */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">

            <h2 className="text-2xl font-bold">
              {editingNoteId
                ? "Edit Note"
                : "Create Note"}
            </h2>

            <div className="mt-6 space-y-4">

              <input
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Note title"
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 outline-none transition focus:border-white/30"
              />

              <textarea
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                placeholder="Write your note..."
                rows={10}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-4 py-4 outline-none transition focus:border-white/30"
              />

              <input
                value={tags}
                onChange={(e) =>
                  setTags(e.target.value)
                }
                placeholder="design, coding, ai"
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 outline-none transition focus:border-white/30"
              />

              <button
                onClick={saveNote}
                disabled={saving}
                className="w-full rounded-2xl bg-white py-4 font-bold text-black transition hover:scale-[1.02] hover:bg-zinc-200 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingNoteId
                  ? "Update Note"
                  : "Save Note"}
              </button>

              {editingNoteId && (
                <button
                  onClick={resetForm}
                  className="w-full rounded-2xl border border-white/10 py-4 font-semibold transition hover:bg-white/10"
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </section>

          {/* NOTES */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">

            <div className="flex items-center justify-between">

              <h2 className="text-2xl font-bold">
                Notes
              </h2>

              <span className="text-sm text-zinc-500">
                {filteredNotes.length} notes
              </span>
            </div>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search notes..."
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 outline-none transition focus:border-white/30"
            />

            <div className="mt-6 space-y-5">

              {loading ? (
                <div className="text-zinc-500">
                  Loading notes...
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-zinc-500">
                  No notes found.
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-3xl border border-white/10 bg-black/40 p-6 transition hover:-translate-y-1 hover:border-white/20"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="text-xl font-bold">
                          {note.title}
                        </h3>

                        <p className="mt-3 whitespace-pre-wrap text-zinc-400">
                          {note.content}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-400">
                        AI:{" "}
                        {note.ai_generated_count || 0}
                      </div>
                    </div>

                    {note.tags?.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">

                        {note.tags.map(
                          (tag, index) => (
                            <span
                              key={index}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                            >
                              #{tag}
                            </span>
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          generateAiSummary(
                            note.id,
                            note.content
                          )
                        }
                        disabled={
                          loadingNoteId ===
                          note.id
                        }
                        className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {loadingNoteId === note.id
                          ? "Generating..."
                          : "AI Summary"}
                      </button>

                      <button
                        onClick={() =>
                          startEditing(note)
                        }
                        className="rounded-xl border border-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
                      >
                        Edit
                      </button>

                      <a
                        href={`/share/${note.share_id}`}
                        target="_blank"
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
                      >
                        Share
                      </a>

                      <button
                        onClick={() =>
                          archiveNote(note.id)
                        }
                        className="rounded-xl border border-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/10"
                      >
                        Archive
                      </button>

                      <button
                        onClick={() =>
                          deleteNote(note.id)
                        }
                        className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AI OUTPUT */}

            {aiSummary && (
              <div className="mt-8 rounded-3xl border border-green-500/20 bg-green-500/10 p-6">

                <h3 className="text-lg font-bold text-green-300">
                  AI Summary
                </h3>

                <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-200">
                  {aiSummary}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

// =========================
// STAT CARD
// =========================

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20">

      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-black">
        {value}
      </h3>
    </div>
  );
}