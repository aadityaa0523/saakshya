import { addEvidence, listEvidence, MAX_EVIDENCE_BYTES, NO_UPLOAD_CATEGORY, sniffType } from "@/lib/evidence";
import { query } from "@/lib/server";
import { getReport } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  return Response.json({ files: await listEvidence(query, report.id) });
}

export async function POST(request: Request, { params }: Context) {
  const report = await getReport(query, (await params).id, request.headers.get("x-report-token") ?? "");
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  if (report.fields.category === NO_UPLOAD_CATEGORY) return Response.json({ error: "Please do not upload files for this kind of report. Use the official portal at cybercrime.gov.in, which has a dedicated route." }, { status: 403 });
  const file = (await request.formData().catch(() => null))?.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_EVIDENCE_BYTES) return Response.json({ error: "Please choose a file of up to 4 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffType(bytes);
  if (!mime) return Response.json({ error: "Please upload a JPG, PNG, WebP or PDF file." }, { status: 415 });
  const saved = await addEvidence(query, report.id, file.name, bytes, mime);
  if (!saved) return Response.json({ error: "This report already has the maximum of 10 files." }, { status: 409 });
  return Response.json(saved, { status: 201 });
}
