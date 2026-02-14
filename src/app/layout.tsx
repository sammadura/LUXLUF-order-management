import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXLUF Order Management",
  description:
    "Same-day floral order management for LUXLUF Event Flowers NYC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-luxluf-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <a
              href="/"
              className="font-serif text-2xl text-luxluf-800 tracking-widest"
            >
              LUXLUF
            </a>
            <nav className="flex gap-6 text-sm text-luxluf-600">
              <a
                href="/dashboard"
                className="hover:text-luxluf-800 transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/orders/new"
                className="hover:text-luxluf-800 transition-colors"
              >
                New Order
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
