export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at about 4.5 MB

/** Audio goes to the speech API and is not stored. The victim confirms the text before triage. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const audio = form?.get("file");
  if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_BYTES) return Response.json({ error: "Please record a shorter voice note." }, { status: 400 });
  if (!process.env.SARVAM_API_KEY) return Response.json({ error: "Voice is unavailable right now. Please type instead." }, { status: 503 });

  const outgoing = new FormData();
  outgoing.append("file", audio);
  outgoing.append("model", "saaras:v3");
  try {
    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": process.env.SARVAM_API_KEY },
      body: outgoing,
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const { transcript, language_code } = await response.json();
    return Response.json({ transcript, language: language_code });
  } catch {
    return Response.json({ error: "We could not hear that. Please try again or type instead." }, { status: 502 });
  }
}
