"use client";

import Link from "next/link";
import { ArrowLeft, Info, Settings } from "lucide-react";

export default function AuthHeader() {
  return (
    <header className="relative z-10 flex h-16 items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-xl px-8">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary">
            ApexFC
          </h1>

          <div className="h-5 w-px bg-border" />

          <span className="text-xs tracking-[0.25em] text-muted-foreground">
            v1.0
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Info
          size={18}
          className="cursor-pointer text-muted-foreground hover:text-primary"
        />

        <Settings
          size={18}
          className="cursor-pointer text-muted-foreground hover:text-primary"
        />
      </div>
    </header>
  );
}