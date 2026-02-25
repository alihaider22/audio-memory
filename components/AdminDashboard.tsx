"use client";

import { useState, useEffect, useCallback } from "react";
import createClientForBrowser from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

type QRCodeType = {
  id: string;
  unique_code: string;
  created_at: string;
  audio_memories: { id: string } | null;
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
  qrCodes: QRCodeType[];
  userEmail: string;
}) {
  const supabase = createClientForBrowser();
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [selectedQR, setSelectedQR] = useState<QRCodeType | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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
      const hasAudio = !!qr.audio_memories ? "Yes" : "No";
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

  const openQRModal = useCallback(async (qr: QRCodeType) => {
    setSelectedQR(qr);
    const url = `${window.location.origin}/qr/${qr.unique_code}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
    setQrDataUrl(dataUrl);
  }, []);

  function closeQRModal() {
    setSelectedQR(null);
    setQrDataUrl(null);
  }

  function downloadQR() {
    if (!qrDataUrl || !selectedQR) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${selectedQR.unique_code}.png`;
    a.click();
  }

  // Close modal on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeQRModal();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  const totalCodes = qrCodes.length;
  const withAudio = qrCodes.filter(
    (qr) => !!qr.audio_memories
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
                !!qr.audio_memories;
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
                    <button
                      onClick={() => openQRModal(qr)}
                      className="text-xs text-primary hover:underline"
                    >
                      QR
                    </button>
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
      {/* QR Code Modal */}
      {selectedQR && qrDataUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeQRModal}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <img
                src={qrDataUrl}
                alt={`QR code for ${selectedQR.unique_code}`}
                className="mx-auto mb-4 rounded-lg"
              />
              <p className="font-mono text-sm text-foreground mb-1">
                {selectedQR.unique_code}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {window.location.origin}/qr/{selectedQR.unique_code}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeQRModal}
                  className="flex-1 py-2 border border-border rounded-xl text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={downloadQR}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
