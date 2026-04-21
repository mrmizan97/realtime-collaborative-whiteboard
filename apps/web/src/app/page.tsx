import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight">Canvasly</h1>
        <p className="text-lg text-neutral-600">
          A collaborative whiteboard that handles concurrent edits, offline work, and fast rendering —
          all built on Yjs.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/sign-in"
            className="px-5 py-2.5 bg-neutral-900 text-white rounded-md hover:bg-neutral-800"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 border border-neutral-300 rounded-md hover:bg-neutral-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
