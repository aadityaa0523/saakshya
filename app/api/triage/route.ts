import { runTriage } from "@/lib/agent";
import { clientOf, overLimit } from "@/lib/evidence";
import { askWithinRoute } from "@/lib/llm";
import { SecretBlocked } from "@/lib/safety";
import { query, tools } from "@/lib/server";
import { createReport } from "@/lib/store";

export const maxDuration = 60;

/** Streams one JSON object per line: agent steps as they happen, then the result or an error. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const story = typeof body?.story === "string" ? body.story.trim() : "";
  const language = typeof body?.language === "string" ? body.language.slice(0, 20) : "en";
  if (story.length < 10 || story.length > 5000) return Response.json({ error: "Please describe what happened in 10 to 5000 characters." }, { status: 400 });
  // A database failure is left to the save step below, which reports it honestly
  if (await overLimit(query, clientOf(request), "triage", 8).catch(() => false)) return Response.json({ error: "Too many requests. If money was sent, call 1930 now, then try again in a minute." }, { status: 429 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (message: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(message) + "\n"));
        } catch {
          // The browser went away. The report is still saved, and this must not crash the function.
        }
      };
      try {
        const result = await runTriage(story, language, { ...tools, ask: askWithinRoute() }, (step) => send({ step }));
        const { id, token } = await createReport(query, result, language);
        send({ result, id, token });
      } catch (error) {
        const blocked = error instanceof SecretBlocked;
        if (!blocked) console.error("triage failed", error instanceof Error ? error.name : "unknown");
        send({ error: blocked ? error.message : "We could not finish this right now, and nothing was saved. If money was sent, call 1930 now, then try again.", blocked });
      }
      try {
        controller.close();
      } catch {
        // already closed by a disconnected browser
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
