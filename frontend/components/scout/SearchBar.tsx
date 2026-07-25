"use client";

import { Search } from "lucide-react";
import { useScout } from "./ScoutContext";

export default function SearchBar() {
  const { search, setSearch } = useScout();

  return (
    <div className="relative flex-1 max-w-2xl">

      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={18}
      />

      <input
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Search players, clubs, leagues..."
        className="w-full rounded-xl border bg-background py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

    </div>
  );
}