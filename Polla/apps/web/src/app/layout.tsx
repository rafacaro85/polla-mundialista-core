import "./globals.css";
import type { Metadata } from "next";
import { Inter, Russo_One } from "next/font/google";
import { AuthProvider } from "../lib/auth.tsx";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });
const russo = Russo_One({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Polla Virtual",
  description: "Participa y gana",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Polla Virtual",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00E676",
};

import { GlobalThemeProvider } from "@/components/GlobalThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={cn(inter.className, "bg-white text-slate-900 antialiased min-h-screen")} suppressHydrationWarning={true}>
        <GlobalThemeProvider>
          <AuthProvider>
            {children}
            <Footer />
          </AuthProvider>
        </GlobalThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
