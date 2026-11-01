import { query } from "@/lib/server";
import { getReport } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  const { token_hash: _omit, ...visible } = report; // eslint-disable-line @typescript-eslint/no-unused-vars
  return Response.json(visible);
}

export async function DELETE(request: Request, { params }: Context) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  await query("DELETE FROM reports WHERE id = $1", [report.id]);
  return new Response(null, { status: 204 });
}
