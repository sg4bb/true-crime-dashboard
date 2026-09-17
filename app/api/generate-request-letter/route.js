import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const LETTER_TEMPLATE = `Subject: Public Records Request - [Suspect Name / Incident Type] - [Incident Date]

Dear Records Custodian,

Date of Incident/Arrest: [Month DD, YYYY]
Location: [City, State]

Under the [State Public Records Act Name & Citation], I am formally requesting digital
copies of records maintained by the [Police Department / Sheriff's Office Name] regarding
the arrest of [Suspect Description/Name] for [Primary Offense/Reason for arrest].

Case Details:

* Suspect: [Full Name, or description/first name if full name unknown]
* Occupation: [Occupation if mentioned, otherwise "N/A" or omit]
* Incident/Arrest Date: [Month DD, YYYY]
* Location: [Specific location, e.g., bank, store address, or City, State]
* Arresting Agency: [Exact Police Department / Sheriff's Office]
* Charges Filed: [List of charges]
* Details: [A concise 2-3 sentence summary of the incident: what happened, how police
  responded, and the outcome]

Specific Records Requested:

1. The arrest affidavit, incident report, and booking records associated with this case.
2. The relevant Body-Worn Camera (BWC) footage, dashcam footage, and surveillance footage
   covering the detention, interview, and arrest.
3. The agency case/incident number and suspect's full legal name, if not already specified
   above.

Please provide these records in digital video/document format via email or secure download
portal. If fees apply or if redactions are necessary, please notify me in advance.

Thank you for your prompt attention, diligence, and assistance.

Best Regards`;

const SYSTEM_PROMPT = `You are drafting a public records request letter for a true-crime
research team. Fill in the template below using ONLY the case data provided by the user —
never invent facts, names, dates, or details that weren't given to you.

Rules:
- Infer the U.S. state from the agency name / location, and use the correct public records
  act name and citation for that state (e.g. Florida: "Florida Public Records Act, Chapter
  119, Florida Statutes"; Ohio: "Ohio Public Records Act, R.C. 149.43"; Illinois: "Illinois
  Freedom of Information Act, 5 ILCS 140"). If you are not confident which state or citation
  applies, leave the placeholder "[State Public Records Act Name & Citation]" instead of
  guessing.
- If "Occupation" isn't known, write "N/A".
- "Details" should be a concise 2-3 sentence summary based on the case summary/charges
  provided — do not fabricate details not present in the source data.
- Keep every other part of the letter's wording and structure EXACTLY as in the template
  (same headings, same bullet structure, same closing).
- Output ONLY the finished letter text, no commentary, no markdown formatting, no code
  fences.

Template:
${LETTER_TEMPLATE}`;

function buildCaseData(c) {
  return `Report #: ${c.report_number || "—"}
Agency: ${c.pd || "—"}
Incident type: ${c.incident_type || "—"}
Incident date: ${c.incident_date || "—"}
Location: ${c.incident_location || "—"}
Suspect: ${c.suspect || "—"}
Charges: ${c.charges || "—"}
Summary: ${c.summary || "—"}`;
}

export async function POST(request) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server isn't configured with NVIDIA_API_KEY yet." },
        { status: 500 }
      );
    }

    const { data: caseItem, error: fetchError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (fetchError || !caseItem) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    const nvidiaRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildCaseData(caseItem) },
        ],
        temperature: 0.3,
        top_p: 0.95,
        max_tokens: 900,
        reasoning_budget: 512,
      }),
    });

    if (!nvidiaRes.ok) {
      const errText = await nvidiaRes.text();
      console.error("NVIDIA API error:", errText);
      return NextResponse.json(
        { error: "The AI provider returned an error. Please try again." },
        { status: 502 }
      );
    }

    const nvidiaData = await nvidiaRes.json();
    const message = nvidiaData?.choices?.[0]?.message;
    const letter = (message?.content || message?.reasoning_content || "").trim();

    if (!letter) {
      return NextResponse.json({ error: "Empty response from AI provider." }, { status: 502 });
    }

    return NextResponse.json({ letter });
  } catch (err) {
    console.error("generate-request-letter error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}