import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";;
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TacticalAdvisorProvider } from "@/components/providers/TacticalAdvisorProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ApexFC",
  description: "Football Analytics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable)} data-scroll-behavior="smooth">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <TacticalAdvisorProvider>
            {children}
          </TacticalAdvisorProvider>
        </AuthProvider>
        <Toaster
          richColors
          position="top-right"
          closeButton
        />
      </body>
    </html>
  );
}