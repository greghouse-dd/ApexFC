"use client";

import { ScoutProvider } from "@/components/scout/ScoutContext";

import ScoutToolbar from "@/components/scout/ScoutToolbar";
import PlayerGrid from "@/components/scout/PlayerGrid";
import FilterSidebar from "@/components/scout/FilterSidebar";

export default function ScoutPage() {
  return (
    <ScoutProvider>
      {/* Full-screen background image behind sidebar and header */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: "url('/images/scout/scout-1.jpg')" }}
      />
      {/* Dark overlay for contrast and readability */}
      <div className="fixed inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none z-0" />

      <div className="flex h-full relative z-10 bg-transparent">
        <div className="flex flex-1 relative">
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