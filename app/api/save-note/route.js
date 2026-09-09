import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const { caseId, noteHtml } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server isn't configured with SUPABASE_SERVICE_ROLE_KEY yet." },
        { status: 500 }
      );
    }

    const notesCreatedAt = new Date().toISOString();

    // notes_edited_by stays null for now — there's no login yet. Once
    // authentication exists, pass the current user's name/id here instead.
    const { error } = await supabaseAdmin
      .from("cases")
      .update({
        notes: noteHtml,
        notes_created_at: notesCreatedAt,
        notes_edited_by: null,
      })
      .eq("id", caseId);

    if (error) {
      console.error("Error saving note:", error);
      return NextResponse.json({ error: "Couldn't save the note." }, { status: 500 });
    }

    return NextResponse.json({
      notes: noteHtml,
      notesCreatedAt,
      notesEditedBy: null,
    });
  } catch (err) {
    console.error("save-note error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}