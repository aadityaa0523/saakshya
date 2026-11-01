"use client";

import { useRef, useState } from "react";
import { recordingToWav } from "./wav";

/** Records a voice note and returns the words. Audio is sent to be transcribed and is not stored. */
export function useVoice(onText: (text: string) => void, onError: (message: string) => void) {
  const [recording, setRecording] = useState(false);
  const [hearing, setHearing] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);

  async function toggle() {
    if (recorder.current) {
      recorder.current.stop();
      return;
    }
    onError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recorder.current = null;
        setRecording(false);
        setHearing(true);
        const form = new FormData();
        try {
          form.append("file", new File([await recordingToWav(new Blob(chunks))], "voice.wav", { type: "audio/wav" }));
          const response = await fetch("/api/transcribe", { method: "POST", body: form });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error);
          onText(body.transcript);
        } catch (failure) {
          onError(failure instanceof Error ? failure.message : "We could not hear that. Please type instead.");
        }
        setHearing(false);
      };
      media.start();
      // 16 kHz audio reaches the 4 MB upload limit at about two minutes
      setTimeout(() => { if (media.state === "recording") media.stop(); }, 110_000);
      recorder.current = media;
      setRecording(true);
    } catch {
      onError("We could not use your microphone. Please allow it, or type instead.");
    }
  }

  return { recording, hearing, toggle };
}
