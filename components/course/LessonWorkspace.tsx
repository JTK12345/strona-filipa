"use client";

import { useState } from "react";
import type { AccessibleLesson } from "@/app/lib/course-content";

type SaveState = "idle" | "saving" | "saved" | "error";

function LessonContent({ markdown }: { markdown: string }) {
  return markdown.split(/\n{2,}/).map((block) => {
    if (block.startsWith("## ")) {
      return <h2 key={block}>{block.slice(3)}</h2>;
    }

    return <p key={block}>{block}</p>;
  });
}

export function LessonWorkspace({ lesson }: { lesson: AccessibleLesson }) {
  const [completed, setCompleted] = useState(lesson.completed);
  const [progressState, setProgressState] = useState<SaveState>("idle");
  const [note, setNote] = useState(lesson.note);
  const [noteState, setNoteState] = useState<SaveState>("idle");

  async function saveProgress() {
    if (progressState === "saving") {
      return;
    }

    setProgressState("saving");
    const response = await fetch(`/api/progress/lessons/${lesson.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        progressSeconds: lesson.videoDurationSeconds ?? lesson.progressSeconds,
        completed: !completed,
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setProgressState("error");
      return;
    }

    setCompleted((value) => !value);
    setProgressState("saved");
  }

  async function saveNote() {
    if (noteState === "saving") {
      return;
    }

    setNoteState("saving");
    const response = await fetch(`/api/lessons/${lesson.id}/note`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: note }),
    }).catch(() => null);

    setNoteState(response?.ok ? "saved" : "error");
  }

  return (
    <div className="lesson-workspace">
      <header className="lesson-workspace__header">
        <div>
          <span className="eyebrow">{lesson.moduleTitle}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
        </div>
        <button
          type="button"
          className={completed ? "button-secondary" : "button-primary"}
          onClick={saveProgress}
          disabled={progressState === "saving"}
        >
          {progressState === "saving"
            ? "Zapisywanie..."
            : completed
              ? "Oznacz jako nieukończoną"
              : "Oznacz jako ukończoną"}
        </button>
      </header>

      {progressState === "error" ? (
        <p className="auth-error">Nie udało się zapisać postępu.</p>
      ) : null}

      <div className="lesson-workspace__grid">
        <div className="lesson-main">
          {lesson.hasVideo ? (
            <video
              className="lesson-video"
              controls
              controlsList="nodownload"
              preload="metadata"
              src={`/api/media/lessons/${lesson.id}`}
            >
              Twoja przeglądarka nie obsługuje odtwarzania wideo.
            </video>
          ) : (
            <div className="lesson-video-placeholder">
              <span>Materiał wideo</span>
              <strong>Film zostanie dodany przed publikacją kursu.</strong>
            </div>
          )}

          <article className="lesson-content">
            <LessonContent markdown={lesson.contentMarkdown} />
          </article>
        </div>

        <aside className="lesson-note">
          <div>
            <span className="eyebrow">Moja notatka</span>
            <h2>Zapisz najważniejsze obserwacje</h2>
          </div>
          <textarea
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setNoteState("idle");
            }}
            maxLength={5000}
            rows={12}
            placeholder="Twoje obserwacje po lekcji..."
          />
          <button
            type="button"
            className="button-secondary"
            onClick={saveNote}
            disabled={noteState === "saving"}
          >
            {noteState === "saving" ? "Zapisywanie..." : "Zapisz notatkę"}
          </button>
          {noteState === "saved" ? (
            <p className="lesson-note__status">Notatka została zapisana.</p>
          ) : null}
          {noteState === "error" ? (
            <p className="auth-error">Nie udało się zapisać notatki.</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
