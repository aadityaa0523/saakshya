import { missingFields, ReportEdit } from "@/lib/agent";
import { sanitize, SecretBlocked } from "@/lib/safety";
import { query } from "@/lib/server";
import { appendEvent, getReport } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  const { token_hash: _omit, ...visible } = report; // eslint-disable-line @typescript-eslint/no-unused-vars
  return Response.json(visible);
}

export async function PATCH(request: Request, { params }: Context) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  const edit = ReportEdit.safeParse(await request.json().catch(() => null));
  if (!edit.success) return Response.json({ error: "Please check the details. A UTR has 12 digits, and an IFSC looks like SBIN0001234." }, { status: 400 });
  const { draft, ...changes } = edit.data;
  try {
    sanitize(`${draft ?? ""} ${JSON.stringify(changes)}`);
  } catch (error) {
    if (error instanceof SecretBlocked) return Response.json({ error: error.message }, { status: 422 });
    throw error;
  }
  const fields = { ...report.fields, ...changes, ...(draft === undefined ? {} : { draft_edited: true }) };
  await query("UPDATE reports SET fields = $1, draft = COALESCE($2, draft) WHERE id = $3", [JSON.stringify(fields), draft ?? null, report.id]);
  await appendEvent(query, report.id, { type: "details_edited", changed: Object.keys(edit.data) });
  return Response.json({ fields, missing: missingFields(fields) });
}

export async function DELETE(request: Request, { params }: Context) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  await query("DELETE FROM reports WHERE id = $1", [report.id]);
  return new Response(null, { status: 204 });
}
