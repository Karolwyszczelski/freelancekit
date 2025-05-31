import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Brak promptu." }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // lub "gpt-3.5-turbo"
      messages: [
        { role: "system", content: "Jesteś ekspertem od nowoczesnych ofert biznesowych." },
        { role: "user", content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });
    return NextResponse.json({ offer: completion.choices[0].message.content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Błąd generowania." }, { status: 500 });
  }
}
