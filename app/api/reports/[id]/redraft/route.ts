import { writeDraft } from "@/lib/agent";
import { clientOf, overLimit } from "@/lib/evidence";
import { askLlm } from "@/lib/llm";
import { query } from "@/lib/server";
import { appendEvent, getReport } from "@/lib/store";

export const maxDuration = 60;

/** Writes the draft again, for when the AI was unavailable or the victim wants a fresh one. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  if (await overLimit(query, clientOf(request), "redraft", 6).catch(() => false)) return Response.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  const written = await writeDraft(report.story, report.fields, report.laws, report.language, askLlm, () => {});
  if (!written.draft) return Response.json({ error: "We could not write a draft that passes our checks right now. Your details are safe, so please try again shortly." }, { status: 503 });
  const fields = { ...report.fields, draft_edited: false };
  await query("UPDATE reports SET fields = $1, draft = $2, draft_translated = $3 WHERE id = $4", [JSON.stringify(fields), written.draft, written.draftTranslated, report.id]);
  await appendEvent(query, report.id, { type: "draft_rewritten" });
  return Response.json({ fields, draft: written.draft, draft_translated: written.draftTranslated });
}
