"use client";

import { ScoutProvider } from "@/components/scout/ScoutContext";
import PlayerPlotDashboard from "@/components/scout/PlayerPlotDashboard";
import FilterSidebar from "@/components/scout/FilterSidebar";

export default function PlayerPlotPage() {
  return (
    <ScoutProvider>
      <div 
        className="flex h-full overflow-hidden bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/images/scout/scout-1.jpg')" }}
      >
        {/* Dark overlay for contrast and readability */}
        <div className="absolute inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none" />

        <div className="flex flex-1 relative z-10 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <PlayerPlotDashboard />
          </div>
          <FilterSidebar />
        </div>
      </div>
    </ScoutProvider>
  );
}
