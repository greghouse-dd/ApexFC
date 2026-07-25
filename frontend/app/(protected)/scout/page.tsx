"use client";

import { ScoutProvider } from "@/components/scout/ScoutContext";

import ScoutToolbar from "@/components/scout/ScoutToolbar";
import PlayerGrid from "@/components/scout/PlayerGrid";
import FilterSidebar from "@/components/scout/FilterSidebar";

export default function ScoutPage() {
  return (
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
              <PlayerGrid />
            </div>
          </div>

          <FilterSidebar />
        </div>
      </div>
    </ScoutProvider>
  );
}