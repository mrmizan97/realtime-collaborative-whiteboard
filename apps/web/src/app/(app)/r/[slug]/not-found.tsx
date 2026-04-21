import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Room not found</h1>
        <p className="text-neutral-500">You may not have access, or this room doesn&apos;t exist.</p>
        <Link href="/dashboard" className="text-blue-600 underline">Back to dashboard</Link>
      </div>
    </main>
  );
}
