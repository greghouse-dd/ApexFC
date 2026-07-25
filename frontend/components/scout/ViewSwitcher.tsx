"use client";

import {
  Grid2X2,
  List,
} from "lucide-react";

import { useScout } from "./ScoutContext";

export default function ViewSwitcher() {
  const { view, setView } =
    useScout();

  return (
    <div className="flex overflow-hidden rounded-xl border">

      <button
        onClick={() =>
          setView("grid")
        }
        className={`flex items-center gap-2 px-4 py-3 transition ${
          view === "grid"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent"
        }`}
      >
        <Grid2X2 size={18} />

        Grid
      </button>

      <button
        onClick={() =>
          setView("list")
        }
        className={`flex items-center gap-2 px-4 py-3 transition ${
          view === "list"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent"
        }`}
      >
        <List size={18} />

        List
      </button>

    </div>
  );
}