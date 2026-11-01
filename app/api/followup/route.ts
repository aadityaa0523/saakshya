import { runFollowup } from "@/lib/agent";
import { askLlm } from "@/lib/llm";
import { SecretBlocked } from "@/lib/safety";
import { query } from "@/lib/server";
import { appendEvent, getReport } from "@/lib/store";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const report = await getReport(query, String(body?.id ?? ""), request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 2000) return Response.json({ error: "Please write an update of up to 2000 characters." }, { status: 400 });
  try {
    const { fields, missing, story } = await runFollowup(text, report.fields, askLlm);
    await query("UPDATE reports SET fields = $1, story = story || E'\\n\\n' || $2 WHERE id = $3", [JSON.stringify(fields), story, report.id]);
    await appendEvent(query, report.id, { type: "update_added" });
    return Response.json({ fields, missing });
  } catch (error) {
    if (error instanceof SecretBlocked) return Response.json({ error: error.message }, { status: 422 });
    return Response.json({ error: "We could not read that update right now. Nothing was changed." }, { status: 503 });
  }
}
