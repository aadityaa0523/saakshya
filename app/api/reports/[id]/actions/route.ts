import { query } from "@/lib/server";
import { appendEvent, getReport } from "@/lib/store";

const ACTIONS = new Set(["called_1930", "told_bank", "filed_portal", "filed_police"]);

/** The victim records what they really did. The app itself never files anything. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!ACTIONS.has(body?.action)) return Response.json({ error: "Unknown action" }, { status: 400 });
  const acknowledgement = typeof body.acknowledgement === "string" ? body.acknowledgement.trim().slice(0, 40) : null;
  await appendEvent(query, report.id, { type: body.action, acknowledgement });
  return Response.json({ ok: true });
}
