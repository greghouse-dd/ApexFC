"use client";

import { useEffect } from "react";
import BackgroundGrid from "./BackgroundGrid";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";
import AuthCard from "./AuthCard";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({
  children
}: Props) {
  useEffect(() => {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--primary-foreground");
  }, []);
  return (
    <div className="flex min-h-screen flex-col bg-background">

      <BackgroundGrid />

      <AuthHeader />

      <main className="relative flex flex-1 items-center justify-center p-8">

        <AuthCard>

          {children}

        </AuthCard>

      </main>

      <AuthFooter />

    </div>
  );
}