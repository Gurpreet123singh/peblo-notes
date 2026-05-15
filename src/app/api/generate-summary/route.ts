import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function fallbackSummary(content: string) {
  const short =
    content.length > 120
      ? content.slice(0, 120) + "..."
      : content;

  return `
Summary:
${short}

Action Items:
- Review the note
- Organize key tasks
- Follow up if needed

Suggested Title:
Quick Note Summary
`;
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return Response.json(
        { error: "Note content is required." },
        { status: 400 }
      );
    }

    try {
      const completion =
        await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You summarize notes and generate action items.",
            },
            {
              role: "user",
              content,
            },
          ],
        });

      const text =
        completion.choices[0]?.message?.content;

      return Response.json({
        summary:
          text || fallbackSummary(content),
      });
    } catch {
      return Response.json({
        summary: fallbackSummary(content),
      });
    }
  } catch {
    return Response.json(
      { error: "Failed to generate summary." },
      { status: 500 }
    );
  }
}