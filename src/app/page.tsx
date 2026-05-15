"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Note = {
  id: number;
  title: string;
  content: string;
  share_id: string;
  tags: string[];
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

  const [loadingNoteId, setLoadingNoteId] =
    useState<number | null>(null);
    const totalNotes = notes.length;

const totalTags = notes.reduce(
  (acc, note) => acc + (note.tags?.length || 0),
  0
);

const allTags = notes.flatMap(
  (note) => note.tags || []
);

const mostUsedTag =
  allTags.length > 0
    ? allTags.sort(
        (a, b) =>
          allTags.filter((v) => v === b).length -
          allTags.filter((v) => v === a).length
      )[0]
    : "No tags";

  async function fetchNotes() {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setNotes(data);
    }
  }

  async function saveNote() {
    if (!title || !content) return;

    const formattedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingNoteId) {
      const { error } = await supabase
        .from("notes")
        .update({
          title,
          content,
          tags: formattedTags,
        })
        .eq("id", editingNoteId);

      if (!error) {
        resetForm();
        fetchNotes();
      }

      return;
    }

    const { error } = await supabase
      .from("notes")
      .insert([
        {
          title,
          content,
          tags: formattedTags,
        },
      ]);

    if (!error) {
      resetForm();
      fetchNotes();
    }
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setTags("");
    setEditingNoteId(null);
  }

  function startEditing(note: Note) {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.join(", ") || "");
  }

  async function deleteNote(noteId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (!error) {
      fetchNotes();
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    router.push("/login");
  }

  async function generateAiSummary(
    noteId: number,
    noteContent: string
  ) {
    setLoadingNoteId(noteId);
    setAiSummary("");

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

    setLoadingNoteId(null);
  }

  const filteredNotes = notes.filter(
    (note) => {
      const keyword =
        search.toLowerCase();

      return (
        note.title
          .toLowerCase()
          .includes(keyword) ||
        note.content
          .toLowerCase()
          .includes(keyword)
      );
    }
  );

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

    const channel = supabase
      .channel("notes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  checkUser();
}, []);

  return (
    <main className="min-h-screen bg-transparent p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Peblo Notes
            </h1>

            <p className="mt-2 text-zinc-400">
              Collaborative AI-powered
              notes workspace
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-2xl border border-red-500/20 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-zinc-400">Total Notes</p>
          <h3 className="mt-2 text-3xl font-bold">{totalNotes}</h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-zinc-400">Total Tags</p>
          <h3 className="mt-2 text-3xl font-bold">{totalTags}</h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-zinc-400">Most Used Tag</p>
          <h3 className="mt-2 text-3xl font-bold">#{mostUsedTag}</h3>
        </div>
      </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">
              {editingNoteId
                ? "Edit Note"
                : "Create Note"}
            </h2>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Note title"
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none placeholder:text-zinc-500"
            />

            <textarea
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              placeholder="Write your note here..."
              rows={10}
              className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none placeholder:text-zinc-500"
            />

            <input
              value={tags}
              onChange={(e) =>
                setTags(e.target.value)
              }
              placeholder="Tags, comma separated e.g. work, meeting"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none placeholder:text-zinc-500"
            />

            <button
              onClick={saveNote}
              className="mt-4 w-full rounded-2xl bg-white py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
              {editingNoteId
                ? "Update Note"
                : "Save Note"}
            </button>

            {editingNoteId && (
              <button
                onClick={resetForm}
                className="mt-3 w-full rounded-2xl border border-white/10 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Cancel Editing
              </button>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">
              Notes
            </h2>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search notes..."
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none placeholder:text-zinc-500"
            />

            <div className="mt-5 space-y-4">
              {filteredNotes.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-zinc-400">
                  No notes yet. Create
                  your first note.
                </div>
              ) : (
                filteredNotes.map(
                  (note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl border border-white/10 bg-black p-5"
                    >
                      <h3 className="text-lg font-semibold">
                        {note.title}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-zinc-400">
                        {note.content}
                      </p>

                      {note.tags &&
                        note.tags.length >
                          0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {note.tags.map(
                              (
                                tag,
                                index
                              ) => (
                                <span
                                  key={
                                    index
                                  }
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                                >
                                  #{tag}
                                </span>
                              )
                            )}
                          </div>
                        )}

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() =>
                            generateAiSummary(
                              note.id,
                              note.content
                            )
                          }
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
                          disabled={
                            loadingNoteId ===
                            note.id
                          }
                        >
                          {loadingNoteId ===
                          note.id
                            ? "Generating..."
                            : "Generate AI Summary"}
                        </button>

                        <button
                          onClick={() =>
                            startEditing(
                              note
                            )
                          }
                          className="rounded-full border border-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
                        >
                          Edit
                        </button>

                        <a
                          href={`/share/${note.share_id}`}
                          target="_blank"
                          className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Share Note
                        </a>

                        <button
                          onClick={() =>
                            deleteNote(
                              note.id
                            )
                          }
                          className="rounded-full border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            {aiSummary && (
              <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
                <h3 className="font-semibold text-green-300">
                  AI Output
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-zinc-200">
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