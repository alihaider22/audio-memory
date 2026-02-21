import { createClientForServer } from "@/utils/supabase/server";
import AudioPlayer from "@/components/AudioPlayer";
import AudioMemoryUploader from "@/components/AudioMemoryUploader";

type Params = Promise<{ code: string }>;

export default async function QRCodePage({ params }: { params: Params }) {
  const { code } = await params;
  const supabase = await createClientForServer();

  const { data: qrCode } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("unique_code", code)
    .single();

  if (!qrCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center px-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            QR Code Not Found
          </h1>
          <p className="text-muted-foreground">
            This QR code doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const { data: audioMemory } = await supabase
    .from("audio_memories")
    .select("*")
    .eq("qr_code_id", qrCode.id)
    .single();

  if (audioMemory) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <AudioPlayer audioUrl={audioMemory.audio_url} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AudioMemoryUploader qrCodeId={qrCode.id} qrCode={code} />
    </div>
  );
}
