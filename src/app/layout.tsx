import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة المعرفة العقائدية الشيعية",
  description:
    "منصة معرفية تنافسية تجمع بين التعلم والمراجعة والتحدي المحترم من خلال أسئلة مستندة إلى مصادر شيعية موثقة.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#82CAFA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-brand-gradient min-h-screen font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
