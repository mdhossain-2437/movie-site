import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Manrope } from "next/font/google";
import { ExperienceProviders } from "@/components/experience/providers";
import "./globals.css";

// next/font downloads font files at build time and self-hosts them,
// so no third-party font CDN is used at runtime (design system §4.1).
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CINEVA",
    template: "%s · CINEVA",
  },
  description: "World cinema, restored classics, and original features in high definition.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${geistMono.variable}`}>
      <body className="bg-canvas text-text flex min-h-dvh max-w-full flex-col overflow-x-clip font-sans antialiased">
        <a
          href="#main"
          className="focus:bg-text focus:text-canvas sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sm focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <ExperienceProviders>{children}</ExperienceProviders>
      </body>
    </html>
  );
}
