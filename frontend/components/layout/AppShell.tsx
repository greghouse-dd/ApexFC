"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import { SidebarProvider } from "./SidebarContext";

const COLOR_SCHEMES = [
  { name: "Emerald Mint", primary: "#10b981", secondary: "#06b6d4" },
  { name: "Electric Blue", primary: "#3b82f6", secondary: "#8b5cf6" },
  { name: "Crimson Gold", primary: "#ef4444", secondary: "#f59e0b" },
  { name: "Neon Rose", primary: "#ec4899", secondary: "#f43f5e" },
  { name: "Carbon Tech", primary: "#64748b", secondary: "#94a3b8" }
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollTop = useRef(0);

  const applyColorScheme = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("apex_color_scheme");
    const found = COLOR_SCHEMES.find(c => c.name === stored) || COLOR_SCHEMES[0];
    
    document.documentElement.style.setProperty("--primary", found.primary);
    // Since some shadcn configs rely on oklch fallback for foreground, set an appropriate text contrast color
    const isDarkBackground = found.primary !== "#64748b"; 
    document.documentElement.style.setProperty("--primary-foreground", isDarkBackground ? "#000000" : "#ffffff");
  };

  useEffect(() => {
    applyColorScheme();
    window.addEventListener("squad-updated", applyColorScheme);
    return () => {
      window.removeEventListener("squad-updated", applyColorScheme);
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-foreground");
    };
  }, []);

  // Keep header permanently visible for a stable layout and instant access to search/settings
  useEffect(() => {
    setHeaderVisible(true);
  }, [pathname]);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">

        <AppSidebar />

        <div className="flex flex-1 flex-col overflow-hidden relative">

          <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out transform ${
            headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          }`}>
            <AppHeader title={""} />
          </div>

          <main className={`flex-1 overflow-auto bg-transparent transition-all duration-300 ease-in-out ${
            headerVisible ? "pt-16" : "pt-0"
          }`}>
            {children}
          </main>

        </div>

      </div>
    </SidebarProvider>
  );
}