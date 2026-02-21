import { createClientForServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClientForServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect("/");
  }

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("*, audio_memories(*)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard qrCodes={qrCodes ?? []} userEmail={user.email ?? ""} />
    </div>
  );
}
