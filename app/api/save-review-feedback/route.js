import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const { caseId, feedback, note } = await request.json();

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
        ai_review_feedback: feedback ?? null,
        ai_review_feedback_note: note ?? null,
        ai_review_feedback_at: feedback ? new Date().toISOString() : null,
      })
      .eq("id", caseId);

    if (error) {
      console.error("Error saving review feedback:", error);
      return NextResponse.json({ error: "Couldn't save feedback." }, { status: 500 });
    }

    return NextResponse.json({ feedback, note });
  } catch (err) {
    console.error("save-review-feedback error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}