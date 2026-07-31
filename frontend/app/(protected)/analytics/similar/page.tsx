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
        <div 
          className="flex h-full bg-cover bg-center bg-no-repeat relative"
          style={{ backgroundImage: "url('/images/scout/scout-1.jpg')" }}
        >
          {/* Dark overlay for contrast and readability */}
          <div className="absolute inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none" />

          <div className="flex flex-1 relative z-10">
            <div className="flex flex-1 flex-col">
              <ScoutToolbar />
              <div className="flex-1 overflow-y-auto">
                <SimilarPlayerGrid />
              </div>
            </div>
            <FilterSidebar />
          </div>
        </div>
      </ScoutProvider>
    </Suspense>
  );
}
