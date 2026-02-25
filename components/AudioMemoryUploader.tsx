"use client";

import { useState, useRef, useEffect } from "react";
import createClientForBrowser from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/webm"];

export default function AudioMemoryUploader({
  qrCodeId,
  qrCode,
}: {
  qrCodeId: string;
  qrCode: string;
}) {
  const supabase = createClientForBrowser();
  const router = useRouter();

  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Recording state
  const [mode, setMode] = useState<"upload" | "record">("upload");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { email: user.email } : null);
      setLoading(false);
    });
  }, [supabase.auth]);

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/qr/${qrCode}`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  async function uploadToStorage(file: Blob, extension: string) {
    const fileName = `${qrCodeId}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("audio-files")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("audio-files")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async function saveAudioMemory(audioUrl: string) {
    const { error } = await supabase.from("audio_memories").insert({
      qr_code_id: qrCodeId,
      audio_url: audioUrl,
      uploader_email: user?.email,
    });
    if (error) throw error;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload an MP3, WAV, M4A, or WebM audio file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be under 10MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp3";
      const audioUrl = await uploadToStorage(file, ext);
      await saveAudioMemory(audioUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function discardRecording() {
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordingTime(0);
  }

  async function saveRecording() {
    if (!recordedBlob) return;
    setUploading(true);
    setError("");
    try {
      const audioUrl = await uploadToStorage(recordedBlob, "webm");
      await saveAudioMemory(audioUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show magic link form
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Add an Audio Memory
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to upload or record audio for this QR code
            </p>
          </div>

          {magicLinkSent ? (
            <div className="text-center py-4">
              <p className="text-foreground font-medium">Check your email!</p>
              <p className="text-sm text-muted-foreground mt-2">
                We sent a login link to <strong>{email}</strong>. Click it to
                continue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Send Magic Link
              </button>
            </form>
          )}

          {error && (
            <p className="text-destructive text-sm mt-4 text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Logged in — show upload/record UI
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Add an Audio Memory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a file or record directly
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-secondary rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode("upload")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "upload"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setMode("record")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "record"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Record Audio
          </button>
        </div>

        {mode === "upload" ? (
          <div>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <svg
                  className="w-10 h-10 text-muted-foreground mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm text-muted-foreground">
                  {uploading
                    ? "Uploading..."
                    : "Tap to select an audio file"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP3, WAV, M4A, WebM (max 10MB)
                </p>
              </div>
              <input
                type="file"
                accept="audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,audio/webm"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {!recordedBlob ? (
              <div className="text-center">
                {isRecording && (
                  <div className="mb-4">
                    <div className="w-4 h-4 bg-destructive rounded-full mx-auto mb-2 animate-pulse" />
                    <p className="text-2xl font-mono text-foreground">
                      {formatTime(recordingTime)}
                    </p>
                  </div>
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors ${
                    isRecording
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isRecording ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </button>
                <p className="text-sm text-muted-foreground mt-3">
                  {isRecording ? "Tap to stop" : "Tap to record"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Preview</p>
                  <audio src={recordedUrl!} controls className="w-full" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={discardRecording}
                    disabled={uploading}
                    className="flex-1 py-3 border border-border rounded-xl text-foreground font-medium hover:bg-secondary transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={saveRecording}
                    disabled={uploading}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    {uploading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
