"use client";

import { Suspense } from "react";
import { ScoutProvider } from "@/components/scout/ScoutContext";
import ScoutToolbar from "@/components/scout/ScoutToolbar";
import FilterSidebar from "@/components/scout/FilterSidebar";
import SimilarPlayerGrid from "@/components/analytics/SimilarPlayerGrid";

export default function SimilarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading analytics...</div>}>
      <ScoutProvider>
        <div className="flex h-full">
          <div className="flex flex-1 flex-col">
            <ScoutToolbar />
            <div className="flex-1 overflow-y-auto">
              <SimilarPlayerGrid />
            </div>
          </div>
          <FilterSidebar />
        </div>
      </ScoutProvider>
    </Suspense>
  );
}
