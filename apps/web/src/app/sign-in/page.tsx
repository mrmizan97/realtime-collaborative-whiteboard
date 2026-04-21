"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_CREDENTIALS_LOGIN === "true";

function SignInInner() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";
  const error = sp.get("error");

  const [devEmail, setDevEmail] = useState("admin@canvasly.dev");
  const [devPassword, setDevPassword] = useState("admin123");
  const [magicEmail, setMagicEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const googleEnabled = typeof window !== "undefined"; // button always rendered; fails gracefully if unconfigured
  const emailEnabled = true;

  async function submitDev(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("credentials", {
        email: devEmail,
        password: devPassword,
        callbackUrl,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in to Canvasly</h1>

        {error && (
          <div className="text-sm text-red-600 text-center">
            Sign-in failed. Check email/password or try another provider.
          </div>
        )}

        {DEV_LOGIN_ENABLED && (
          <>
            <form onSubmit={submitDev} className="space-y-3 border border-amber-200 bg-amber-50 p-4 rounded-md">
              <div className="text-xs font-medium text-amber-900 uppercase tracking-wide">Dev login</div>
              <input
                type="email"
                required
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="admin@canvasly.dev"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
              />
              <input
                type="password"
                required
                value={devPassword}
                onChange={(e) => setDevPassword(e.target.value)}
                placeholder="password"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
              />
              <button
                disabled={loading}
                className="w-full px-4 py-2 bg-neutral-900 text-white rounded-md text-sm disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in with password"}
              </button>
              <details className="text-xs text-amber-900">
                <summary className="cursor-pointer">Dummy accounts</summary>
                <ul className="mt-2 space-y-1 font-mono">
                  <li>admin@canvasly.dev / admin123</li>
                  <li>alice@canvasly.dev / user123</li>
                  <li>bob@canvasly.dev / user123</li>
                  <li>carol@canvasly.dev / user123</li>
                </ul>
              </details>
            </form>

            <div className="flex items-center gap-3 text-sm text-neutral-400">
              <div className="h-px flex-1 bg-neutral-200" /> or <div className="h-px flex-1 bg-neutral-200" />
            </div>
          </>
        )}

        {googleEnabled && (
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-md hover:bg-neutral-50"
          >
            Continue with Google
          </button>
        )}

        {emailEnabled && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn("email", { email: magicEmail, callbackUrl });
            }}
            className="space-y-3"
          >
            <input
              type="email"
              required
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
            />
            <button className="w-full px-4 py-2.5 bg-neutral-900 text-white rounded-md">
              Email me a magic link
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-500">Loading…</div>}>
      <SignInInner />
    </Suspense>
  );
}
