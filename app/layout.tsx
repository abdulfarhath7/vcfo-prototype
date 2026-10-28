import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider, THEME_SCRIPT } from "@/components/shell/ThemeProvider";

// R-28: Roboto for the interface, Roboto Mono 500 for identifiers only.
const sans = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans", display: "swap" });
const mono = Roboto_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "VCFO Suite",
  description: "Prototype of VCFO Suite, SBC's compliance tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
