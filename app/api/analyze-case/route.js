import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Channel selection criteria: gives the AI the same context used when
// manually choosing cases.
const SYSTEM_PROMPT = `You are an assistant helping a true-crime YouTube channel decide
whether a police case is worth requesting bodycam / body-worn camera (BWC) footage for.

Evaluate the case using these criteria:
- Was there an active police response at the scene (not just a records/paperwork case)?
- Is the incident type visually or narratively engaging (domestic disputes, assaults,
  altercations caught in progress, arrests with resistance, etc.)? Routine traffic stops,
  minor shoplifting, or simple paperwork violations are weak candidates.
- Is there an identifiable suspect and a clear narrative (who, what, when, where)?
- Is the case closed (stronger candidate) or still open (weaker, footage may be harder
  to obtain via public records request)?

Respond in this exact structure, plain text, no markdown symbols:

Verdict: <Strong candidate / Possible candidate / Weak candidate>
Rating: <1-5>/5
Reasoning: <2-4 concise sentences explaining the verdict based on the criteria above>`;

function buildCaseSummary(c) {
  return `Report #: ${c.report_number || "—"}
Agency: ${c.pd || "—"}
Incident type: ${c.incident_type || "—"}
Incident date: ${c.incident_date || "—"}
Location: ${c.incident_location || "—"}
Suspect: ${c.suspect || "—"}
Status: ${c.status || "—"}
Charges: ${c.charges || "—"}
Summary: ${c.summary || "—"}
Notes: ${c.notes || "—"}`;
}

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

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server isn't configured with NVIDIA_API_KEY yet." },
        { status: 500 }
      );
    }

    const { data: caseItem, error: fetchError } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (fetchError || !caseItem) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    const nvidiaRes = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildCaseSummary(caseItem) },
          ],
          temperature: 0.4,
          top_p: 0.95,
          max_tokens: 400,
          reasoning_budget: 512,
        }),
      }
    );

    if (!nvidiaRes.ok) {
      const errText = await nvidiaRes.text();
      console.error("NVIDIA API error:", errText);
      return NextResponse.json(
        { error: "The AI provider returned an error. Check your NVIDIA_API_KEY / rate limit." },
        { status: 502 }
      );
    }

    const nvidiaData = await nvidiaRes.json();
    const message = nvidiaData?.choices?.[0]?.message;
    const review = (message?.content || message?.reasoning_content || "").trim();

    if (!review) {
      return NextResponse.json({ error: "Empty response from AI provider." }, { status: 502 });
    }

    const generatedAt = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("cases")
      .update({ ai_review: review, ai_review_generated_at: generatedAt })
      .eq("id", caseId);

    if (updateError) {
      console.error("Error saving AI review:", updateError);
      // Still return the review even if it couldn't be saved.
    }

    return NextResponse.json({ review, generatedAt });
  } catch (err) {
    console.error("analyze-case error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}