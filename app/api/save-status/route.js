import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VALID_STATUSES = ["Open", "Closed", "Skipped"];

export async function POST(request) {
  try {
    const { caseId, status } = await request.json();

    if (!caseId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid caseId or status" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server isn't configured with SUPABASE_SERVICE_ROLE_KEY yet." },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin.from("cases").update({ status }).eq("id", caseId);

    if (error) {
      console.error("Error saving status:", error);
      return NextResponse.json({ error: "Couldn't save the status." }, { status: 500 });
    }

    return NextResponse.json({ status });
  } catch (err) {
    console.error("save-status error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}