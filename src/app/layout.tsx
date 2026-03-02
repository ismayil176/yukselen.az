import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingWhatsapp } from "@/components/FloatingWhatsapp";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Yüksəliş – Onlayn imtahan platforması",
  description: "Yüksəliş müsabiqəsinə hazırlıq üçün onlayn imtahan platforması",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body className={`${montserrat.variable} min-h-screen font-sans`}> 
        <SiteHeader />
        {children}
        <FloatingWhatsapp />
      </body>
    </html>
  );
}
