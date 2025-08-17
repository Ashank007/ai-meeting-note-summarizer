import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; 

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { transcript, instruction } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const model = process.env.GROQ_MODEL || "llama3-70b-8192";
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const systemPrompt = `
You are a precise meeting-notes assistant.
Rules:
- Follow the user's instruction strictly.
- Be structured and concise (headings, bullet points).
- Include "Action Items" with owners & deadlines if present.
- No hallucinations; only use info from the transcript.
- If info is missing, say "Not specified".
`;

    const userPrompt = `
Instruction: ${instruction || "Summarize clearly with key points, decisions, risks, and action items."}

Transcript:
"""${transcript}"""
`;

    const resp = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: `Groq error: ${errText}` }, { status: 500 });
    }

    const data = await resp.json();
    const summary = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

