import { Metadata } from "next";
import { Inter, Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import CustomCursor from "@/components/ui/CustomCursor";
import { WidgetLoader } from "@/components/ui/WidgetLoader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Bariweb",
  description: "Bariweb — Leading B2B Digital Accessibility Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${syne.variable} ${spaceMono.variable} scroll-smooth`}>
      <body className="font-sans min-h-full flex flex-col antialiased bg-[#05050a] text-zinc-100 relative">
        <WidgetLoader />
        <LanguageProvider>
          {/* SVG Noise Filter */}
          <svg pointerEvents="none" className="fixed opacity-0 w-0 h-0 z-[-1]">
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            </filter>
          </svg>
          
          {/* Global Scanlines & Noise Overlay */}
          <div className="fixed inset-0 pointer-events-none z-[40] mix-blend-overlay opacity-30">
            <div className="scanlines absolute inset-0" />
          </div>


          <CustomCursor />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
