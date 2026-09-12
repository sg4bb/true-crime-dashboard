import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const { caseId, rating } = await request.json();

    if (!caseId || typeof rating !== "number" || rating < 0 || rating > 5) {
      return NextResponse.json({ error: "Invalid caseId or rating" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server isn't configured with SUPABASE_SERVICE_ROLE_KEY yet." },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin.from("cases").update({ rating }).eq("id", caseId);

    if (error) {
      console.error("Error saving rating:", error);
      return NextResponse.json({ error: "Couldn't save the rating." }, { status: 500 });
    }

    return NextResponse.json({ rating });
  } catch (err) {
    console.error("save-rating error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}