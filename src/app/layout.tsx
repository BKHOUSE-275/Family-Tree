import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Story of Felix and Adaline Mitchell",
  description: "A private family tree — our roots run deep.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${script.variable} ${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-page pb-[env(safe-area-inset-bottom)] text-ink">
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
