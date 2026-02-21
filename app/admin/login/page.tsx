"use client";

import { useState } from "react";
import createClientForBrowser from "@/utils/supabase/client";

export default function AdminLoginPage() {
  const supabase = createClientForBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-foreground text-center mb-2">
            Admin Login
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Sign in to manage QR codes
          </p>

          {sent ? (
            <div className="text-center py-4">
              <p className="text-foreground font-medium">Check your email!</p>
              <p className="text-sm text-muted-foreground mt-2">
                We sent a login link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                required
                placeholder="admin@email.com"
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
    </div>
  );
}
