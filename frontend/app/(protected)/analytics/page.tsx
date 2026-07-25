"use client";

import { Suspense } from "react";
import AnalyticsLayout from "@/components/analytics/AnalyticsLayout";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <AnalyticsLayout />
    </Suspense>
  );
}