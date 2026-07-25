"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type ViewMode = "grid" | "list";

export type SortOption =
  | "overall"
  | "potential"
  | "age"
  | "value"
  | "xg"
  | "xa"
  | "similarity";

interface ScoutContextType {
  search: string;
  setSearch: (value: string) => void;

  view: ViewMode;
  setView: (view: ViewMode) => void;

  sort: SortOption;
  setSort: (sort: SortOption) => void;

  league: string;
  setLeague: (league: string) => void;

  season: string;
  setSeason: (season: string) => void;

  position: string;
  setPosition: (position: string) => void;

  nationality: string;
  setNationality: (nationality: string) => void;

  foot: string;
  setFoot: (foot: string) => void;

  // Sliders
  minAge: number;
  setMinAge: (val: number) => void;

  maxAge: number;
  setMaxAge: (val: number) => void;

  minOverall: number;
  setMinOverall: (val: number) => void;

  minPotential: number;
  setMinPotential: (val: number) => void;

  minHeight: number;
  setMinHeight: (val: number) => void;

  minWeight: number;
  setMinWeight: (val: number) => void;

  maxMarketValue: number;
  setMaxMarketValue: (val: number) => void;

  minXg: number;
  setMinXg: (val: number) => void;

  minGoals: number;
  setMinGoals: (val: number) => void;

  minPassAccuracy: number;
  setMinPassAccuracy: (val: number) => void;

  minProgressivePasses: number;
  setMinProgressivePasses: (val: number) => void;

  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
}

const ScoutContext = createContext<
  ScoutContextType | undefined
>(undefined);

export function ScoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortOption>("overall");

  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");
  const [position, setPosition] = useState("");
  const [nationality, setNationality] = useState("");
  const [foot, setFoot] = useState("");

  // Sliders state
  const [minAge, setMinAge] = useState(15);
  const [maxAge, setMaxAge] = useState(40);
  const [minOverall, setMinOverall] = useState(50);
  const [minPotential, setMinPotential] = useState(50);
  const [minHeight, setMinHeight] = useState(150);
  const [minWeight, setMinWeight] = useState(50);
  const [maxMarketValue, setMaxMarketValue] = useState(250000000);
  const [minXg, setMinXg] = useState(0.0);
  const [minGoals, setMinGoals] = useState(0);
  const [minPassAccuracy, setMinPassAccuracy] = useState(50);
  const [minProgressivePasses, setMinProgressivePasses] = useState(0);

  const [showFilters, setShowFilters] = useState(true);

  const value = useMemo(
    () => ({
      search,
      setSearch,

      view,
      setView,

      sort,
      setSort,

      league,
      setLeague,
      season,
      setSeason,
      position,
      setPosition,
      nationality,
      setNationality,
      foot,
      setFoot,

      minAge,
      setMinAge,
      maxAge,
      setMaxAge,
      minOverall,
      setMinOverall,
      minPotential,
      setMinPotential,
      minHeight,
      setMinHeight,
      minWeight,
      setMinWeight,
      maxMarketValue,
      setMaxMarketValue,
      minXg,
      setMinXg,
      minGoals,
      setMinGoals,
      minPassAccuracy,
      setMinPassAccuracy,
      minProgressivePasses,
      setMinProgressivePasses,

      showFilters,
      setShowFilters,
    }),
    [
      search,
      view,
      sort,
      league,
      season,
      position,
      nationality,
      foot,
      minAge,
      maxAge,
      minOverall,
      minPotential,
      minHeight,
      minWeight,
      maxMarketValue,
      minXg,
      minGoals,
      minPassAccuracy,
      minProgressivePasses,
      showFilters,
    ]
  );

  return (
    <ScoutContext.Provider value={value}>
      {children}
    </ScoutContext.Provider>
  );
}

export function useScout() {
  const context = useContext(ScoutContext);

  if (!context) {
    throw new Error(
      "useScout must be used inside ScoutProvider"
    );
  }

  return context;
}