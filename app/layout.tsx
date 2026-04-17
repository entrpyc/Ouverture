import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ScrollRestorer } from "@/components/scroll-restorer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ouverture",
};

const LAUNCH_YEAR = 2026;

function copyrightYears(): string {
  const current = new Date().getFullYear();
  return current > LAUNCH_YEAR
    ? `${LAUNCH_YEAR}\u2013${current}`
    : `${LAUNCH_YEAR}`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollRestorer />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-zinc-800 text-xs text-zinc-500">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-2 px-6 py-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/help"
                className="rounded-md px-1 py-0.5 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                Help
              </Link>
              <span>&copy; {copyrightYears()} Ouverture</span>
            </div>
            <span>
              Bug reports and suggestions:{" "}
              <a
                href="mailto:indepthwebsolutions@gmail.com"
                className="text-zinc-400 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 rounded-md"
              >
                indepthwebsolutions@gmail.com
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
