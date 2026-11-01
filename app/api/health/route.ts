import { query } from "@/lib/server";

/** Real checks with no personal data, so anyone can confirm the backend is live. */
export async function GET() {
  const database = await query("SELECT count(*)::int AS laws FROM law_sections").then(({ rows }) => ({ ok: true, law_sections: rows[0].laws }), () => ({ ok: false, law_sections: 0 }));
  return Response.json({
    checked_at: new Date().toISOString(),
    database,
    llm_configured: Boolean(process.env.LLM_API_KEY),
    speech_configured: Boolean(process.env.SARVAM_API_KEY),
    whatsapp_configured: Boolean(process.env.TWILIO_AUTH_TOKEN),
  }, { headers: { "Cache-Control": "no-store" } });
}
