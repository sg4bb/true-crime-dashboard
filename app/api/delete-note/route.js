import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server isn't configured with SUPABASE_SERVICE_ROLE_KEY yet." },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin
      .from("cases")
      .update({
        notes: null,
        notes_created_at: null,
        notes_edited_by: null,
      })
      .eq("id", caseId);

    if (error) {
      console.error("Error deleting note:", error);
      return NextResponse.json({ error: "Couldn't delete the note." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-note error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}