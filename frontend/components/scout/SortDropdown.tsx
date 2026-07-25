"use client";

import { ArrowDownWideNarrow } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SortOption,
  useScout,
} from "./ScoutContext";

export default function SortDropdown() {
  const { sort, setSort } =
    useScout();
  const pathname = usePathname();
  const isSimilarPage = pathname?.includes("/similar");

  return (
    <div className="flex items-center gap-2">

      <ArrowDownWideNarrow
        size={18}
      />

      <select
        value={sort}
        onChange={(e) =>
          setSort(
            e.target
              .value as SortOption
          )
        }
        className="rounded-xl border bg-background px-4 py-3 text-sm outline-none"
      >
        {isSimilarPage && (
          <option value="similarity">
            Match %
          </option>
        )}

        <option value="overall">
          Overall
        </option>

        <option value="potential">
          Potential
        </option>

        <option value="age">
          Age
        </option>

        <option value="value">
          Market Value
        </option>

        <option value="xg">
          xG
        </option>

        <option value="xa">
          xA
        </option>

      </select>

    </div>
  );
}