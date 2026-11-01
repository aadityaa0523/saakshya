import { query } from "@/lib/server";
import { getReport, verifyChain } from "@/lib/store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  return Response.json(await verifyChain(query, report.id));
}
