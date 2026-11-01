import { getEvidence } from "@/lib/evidence";
import { query } from "@/lib/server";
import { getReport } from "@/lib/store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params;
  const report = await getReport(query, id, request.headers.get("x-report-token") ?? "");
  const file = report && await getEvidence(query, report.id, fileId);
  if (!file) return Response.json({ error: "File not found" }, { status: 404 });
  if (!file.intact) return Response.json({ error: "This file has changed since it was added, so it was not opened." }, { status: 409 });
  return new Response(new Blob([file.data]), {
    headers: { "Content-Type": file.mime, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`, "Cache-Control": "no-store" },
  });
}
