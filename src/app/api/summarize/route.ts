import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface SummarizeRequest {
  transcript: string;
  instruction?: string;
}

interface GroqChoice {
  message: {
    role: string;
    content: string;
  };
}

interface GroqResponse {
  choices: GroqChoice[];
}

export async function POST(req: NextRequest) {
  try {
    const body: SummarizeRequest = await req.json();

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
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
Instruction: ${body.instruction || "Summarize clearly with key points, decisions, risks, and action items."}

Transcript:
"""${body.transcript}"""
`;

    const resp = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

    const data: GroqResponse = await resp.json();
    const summary: string = data?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


