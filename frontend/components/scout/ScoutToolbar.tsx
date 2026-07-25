"use client";

import SearchBar from "./SearchBar";
import ViewSwitcher from "./ViewSwitcher";
import SortDropdown from "./SortDropdown";
import { useScout } from "./ScoutContext";
import { SlidersHorizontal } from "lucide-react";

export default function ScoutToolbar() {
  const { showFilters, setShowFilters } = useScout();

  return (
    <div className="border-b border-border/40 bg-card/60 backdrop-blur-md px-6 py-4">

      <div className="flex items-center gap-4">

        <SearchBar />

        <ViewSwitcher />

        <SortDropdown />

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition cursor-pointer ${
            showFilters
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground hover:bg-accent border-border"
          }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
        </button>

      </div>

    </div>
  );
}