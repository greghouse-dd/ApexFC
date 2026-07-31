"use client";

import { ScoutProvider } from "@/components/scout/ScoutContext";
import PlayerPlotDashboard from "@/components/scout/PlayerPlotDashboard";
import FilterSidebar from "@/components/scout/FilterSidebar";

export default function PlayerPlotPage() {
  return (
    <ScoutProvider>
      {/* Full-screen background image behind sidebar and header */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: "url('/images/scout/scout-1.jpg')" }}
      />
      {/* Dark overlay for contrast and readability */}
      <div className="fixed inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none z-0" />

      <div className="flex h-full overflow-hidden relative z-10 bg-transparent">
        <div className="flex flex-1 relative overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <PlayerPlotDashboard />
          </div>
          <FilterSidebar />
        </div>
      </div>
    </ScoutProvider>
  );
}
