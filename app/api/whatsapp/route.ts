import { after } from "next/server";
import twilio from "twilio";
import { runTriage } from "@/lib/agent";
import { askWithinRoute } from "@/lib/llm";
import { sanitize, SecretBlocked } from "@/lib/safety";
import { query, tools } from "@/lib/server";
import { createReport } from "@/lib/store";

export const maxDuration = 60;

const twiml = (text: string) => {
  const reply = new twilio.twiml.MessagingResponse();
  if (text) reply.message(text);
  return new Response(reply.toString(), { headers: { "Content-Type": "text/xml" } });
};

async function prepareReport(story: string, send: (body: string) => Promise<unknown>) {
  try {
    const result = await runTriage(story, "auto", { ...tools, ask: askWithinRoute() }, () => {});
    const { id, token } = await createReport(query, result, "auto", "whatsapp");
    await send(
      result.urgency === "crisis"
        ? "You are not alone. Please call Tele-MANAS on 14416 now. It is free and open all day."
        : `${result.fields.summary}\n\nFirst: if money was sent, call 1930 now.\nStill needed: ${result.missing.join(", ") || "nothing"}.\nOpen your report: ${process.env.APP_URL}/report/${id}#${token}`,
    );
  } catch {
    console.error("whatsapp triage failed");
    await send(`We could not finish your report. If money was sent, call 1930 now. Please try again shortly.`).catch(() => {});
  }
}

export async function POST(request: Request) {
  const { TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_WHATSAPP_FROM, APP_URL } = process.env;
  if (!TWILIO_AUTH_TOKEN || !TWILIO_ACCOUNT_SID || !TWILIO_WHATSAPP_FROM || !APP_URL) return new Response("Not configured", { status: 503 });
  const params = Object.fromEntries(new URLSearchParams(await request.text()));
  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, `${APP_URL}/api/whatsapp`, params)) return new Response("Forbidden", { status: 403 });

  const story = (params.Body ?? "").trim();
  if (story.length < 10) return twiml("Tell us what happened in a sentence or two. If money was sent, call 1930 first.");
  if (story.length > 5000) return twiml("That message is too long. Please send a shorter one.");
  try {
    sanitize(story);
  } catch (error) {
    if (error instanceof SecretBlocked) return twiml(error.message);
    throw error;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  // Twilio stops waiting after 15 seconds, so answer now and send the report when it is ready
  after(() => prepareReport(story, (body) => client.messages.create({ from: TWILIO_WHATSAPP_FROM, to: params.From, body })));
  return twiml("We are preparing your report. If money was sent, call 1930 now while you wait.");
}
