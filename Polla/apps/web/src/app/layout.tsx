import type { Metadata } from "next";
import { Inter, Russo_One } from "next/font/google";
import { AuthProvider } from "../lib/auth.tsx";
import Footer from "@/components/Footer";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });
const russo = Russo_One({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Polla Mundialista 2026",
  description: "Participa y gana",
};

export const viewport = {
  maximumScale: 1,
  userScalable: false,
};

import { GlobalThemeProvider } from "@/components/GlobalThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={cn(inter.className, "bg-obsidian text-white antialiased")} suppressHydrationWarning={true}>
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
