import type { Metadata } from "next";
import { Bodoni_Moda, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitAI — AI-Powered Virtual Try-On Technology",
  description:
    "See every outfit before you buy. Paste any clothing link, upload your photo, and get hyper-realistic AI-powered virtual try-on results instantly.",
  keywords: [
    "AI virtual try-on",
    "fashion technology",
    "clothing fit",
    "AI fashion",
    "virtual fitting room",
  ],
  openGraph: {
    title: "FitAI — The Future of Fashion Fit",
    description:
      "AI-powered virtual try-on. Paste any clothing link and see how it fits on your body instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodoni.variable} ${jakarta.variable} antialiased bg-white text-[#0D0D0D]`}
      >
        {children}
      </body>
    </html>
  );
}
