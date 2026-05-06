import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvasly — Collaborative Whiteboard",
  description: "Real-time collaborative whiteboard built with Yjs.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23111827'/%3E%3Cpath d='M8 22 L14 10 L20 22 M9 18 L19 18' stroke='white' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
