import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvasly — Collaborative Whiteboard",
  description: "Real-time collaborative whiteboard built with Yjs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
