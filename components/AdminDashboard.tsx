"use client";

import { useState } from "react";
import createClientForBrowser from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type QRCode = {
  id: string;
  unique_code: string;
  created_at: string;
  audio_memories: { id: string }[] | null;
};

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function AdminDashboard({
  qrCodes,
  userEmail,
}: {
  qrCodes: QRCode[];
  userEmail: string;
}) {
  const supabase = createClientForBrowser();
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setGenerating(true);

    try {
      const codes = Array.from({ length: count }, () => ({
        unique_code: generateShortCode(),
      }));

      const { error } = await supabase.from("qr_codes").insert(codes);
      if (error) throw error;

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate.");
    } finally {
      setGenerating(false);
    }
  }

  function exportCSV() {
    const baseUrl = window.location.origin;
    const header = "QR_Code,URL,Created_At,Has_Audio";
    const rows = qrCodes.map((qr) => {
      const hasAudio = qr.audio_memories && qr.audio_memories.length > 0 ? "Yes" : "No";
      const date = new Date(qr.created_at).toISOString().split("T")[0];
      return `${qr.unique_code},${baseUrl}/qr/${qr.unique_code},${date},${hasAudio}`;
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-codes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  const totalCodes = qrCodes.length;
  const withAudio = qrCodes.filter(
    (qr) => qr.audio_memories && qr.audio_memories.length > 0
  ).length;

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-semibold text-foreground">{totalCodes}</p>
          <p className="text-sm text-muted-foreground">Total QR Codes</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-semibold text-foreground">{withAudio}</p>
          <p className="text-sm text-muted-foreground">With Audio</p>
        </div>
      </div>

      {/* Generate */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Generate QR Codes
        </h2>
        <form onSubmit={handleGenerate} className="flex gap-3">
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-24 px-4 py-2 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={generating}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </form>
        {error && (
          <p className="text-destructive text-sm mt-3">{error}</p>
        )}
      </div>

      {/* Export */}
      {qrCodes.length > 0 && (
        <div className="mb-8">
          <button
            onClick={exportCSV}
            className="px-6 py-2 border border-border rounded-xl text-foreground font-medium hover:bg-secondary transition-colors"
          >
            Export CSV
          </button>
        </div>
      )}

      {/* QR Code List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">QR Codes</h2>
        </div>
        {qrCodes.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No QR codes yet. Generate some above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {qrCodes.map((qr) => {
              const hasAudio =
                qr.audio_memories && qr.audio_memories.length > 0;
              return (
                <div
                  key={qr.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div>
                    <code className="text-sm font-mono text-foreground">
                      {qr.unique_code}
                    </code>
                    <p className="text-xs text-muted-foreground">
                      {new Date(qr.created_at).toISOString().split("T")[0]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        hasAudio
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {hasAudio ? "Has audio" : "Empty"}
                    </span>
                    <a
                      href={`/qr/${qr.unique_code}`}
                      target="_blank"
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
