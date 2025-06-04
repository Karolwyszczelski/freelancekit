// app/api/generate-offer/route.ts
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Brak lub błędny prompt.' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: [
        {
          role: 'system',
          content: `
Jesteś ekspertem od tworzenia profesjonalnych ofert w języku polskim.
Twoim zadaniem jest zwrócić ofertę w formie CZYSTEGO TEKSTU (bez HTML i bez Markdownu).
Nie używaj żadnych tagów HTML ani znaków Markdown. Zwroć wyłącznie treść oferty
jako zwykły tekst, uporządkowany akapitami i wypunktowaniami.
          `.trim(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const textOutput = completion.choices?.[0]?.message?.content || ''
    return NextResponse.json({ offer: textOutput })
  } catch (err: any) {
    console.error('Błąd w /api/generate-offer:', err)
    return NextResponse.json(
      { error: err.message || 'Błąd generowania oferty.' },
      { status: 500 }
    )
  }
}
