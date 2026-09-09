"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  NotebookPen,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 ${
        active ? "bg-amber-500/15 text-amber-400" : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-neutral-700 bg-neutral-900/60">
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={14} />
      </ToolbarButton>

      <span className="w-px h-4 bg-neutral-800 mx-1" />

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={14} />
      </ToolbarButton>

      <span className="w-px h-4 bg-neutral-800 mx-1" />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 size={14} />
      </ToolbarButton>

      <span className="w-px h-4 bg-neutral-800 mx-1" />

      <ToolbarButton
        title="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={14} />
      </ToolbarButton>
    </div>
  );
}

export default function NotesEditor({ caseItem }) {
  const [notes, setNotes] = useState(caseItem.notes || "");
  const [notesCreatedAt, setNotesCreatedAt] = useState(caseItem.notes_created_at || null);
  const [notesEditedBy, setNotesEditedBy] = useState(caseItem.notes_edited_by || null);
  const [mode, setMode] = useState(notes ? "view" : "edit");
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Brainstorm the story, the angle, what to request...",
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: mode === "edit" ? "" : notes,
    editorProps: {
      attributes: {
        class: "note-content min-h-[140px] px-3 py-2.5 focus:outline-none",
      },
    },
  });

  // Fades the current content out, swaps it once it's invisible, then fades
  // the new content back in — avoids the abrupt jump of an instant swap.
  function switchMode(nextMode, beforeSwitch) {
    setVisible(false);
    setTimeout(() => {
      beforeSwitch?.();
      setMode(nextMode);
      setVisible(true);
    }, 150);
  }

  function startNewNote() {
    switchMode("edit", () => {
      editor?.commands.clearContent(true);
      setError(null);
    });
  }

  async function handleSave() {
    if (!editor) return;
    const html = editor.getHTML();
    const isEmpty = editor.getText().trim().length === 0;

    if (isEmpty) {
      setError("Write something before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/save-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseItem.id, noteHtml: html }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save the note.");
      } else {
        setNotes(data.notes);
        setNotesCreatedAt(data.notesCreatedAt);
        setNotesEditedBy(data.notesEditedBy);
        switchMode("view");
      }
    } catch (e) {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-neutral-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-700 bg-neutral-800/50">
        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide">
          <NotebookPen size={12} /> Notes
        </p>
        {mode === "view" && (
          <button
            onClick={startNewNote}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-all duration-150 active:scale-95"
          >
            New note
          </button>
        )}
      </div>

      {mode === "view" ? (
        <div className={`p-4 transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}>
          <div className="note-content" dangerouslySetInnerHTML={{ __html: notes }} />
          <p className="text-[11px] text-neutral-600 mt-3" suppressHydrationWarning>
            {notesCreatedAt && `Created ${new Date(notesCreatedAt).toLocaleString()}`}
            {" · Edited by "}
            {notesEditedBy || "—"}
          </p>
        </div>
      ) : (
        <div className={`transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}>
          <Toolbar editor={editor} />
          <EditorContent editor={editor} />
          <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-800">
            <div className="flex items-center gap-2">
              {error && <p className="text-xs text-red-400">{error}</p>}
              {notes && !error && (
                <p className="text-[11px] text-neutral-600">
                  Saving will replace the existing note.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notes && (
                <button
                  onClick={() => switchMode("view")}
                  className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1 transition-all duration-150 active:scale-95"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-xl text-neutral-300 border border-neutral-700 hover:bg-neutral-200/10 hover:border-neutral-500 active:bg-neutral-200/20 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                Save note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}