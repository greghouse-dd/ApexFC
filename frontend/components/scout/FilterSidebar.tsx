"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useScout } from "./ScoutContext";
import api from "@/lib/api";

type SectionType = "basic" | "profile" | "attacking" | "passing" | null;

export default function FilterSidebar() {
  const {
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
  } = useScout();

  const [openSection, setOpenSection] = useState<SectionType>("basic");
  const [leagues, setLeagues] = useState<string[]>([]);
  const [nationalities, setNationalities] = useState<string[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [leaguesRes, nationalitiesRes] = await Promise.all([
          api.get("/players/leagues"),
          api.get("/players/nationalities")
        ]);
        setLeagues(leaguesRes.data || []);
        setNationalities(nationalitiesRes.data || []);
      } catch (err) {
        console.error("Error fetching metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  const seasons = ["2023/2024"];
  const positions = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST"];
  const feet = ["Left", "Right", "Both"];

  const hasActiveFilters =
    league ||
    season ||
    position ||
    nationality ||
    foot ||
    minAge !== 15 ||
    maxAge !== 40 ||
    minOverall !== 50 ||
    minPotential !== 50 ||
    minHeight !== 150 ||
    minWeight !== 50 ||
    maxMarketValue !== 250000000 ||
    minXg !== 0.0 ||
    minGoals !== 0 ||
    minPassAccuracy !== 50 ||
    minProgressivePasses !== 0;

  const handleClearAll = () => {
    setLeague("");
    setSeason("");
    setPosition("");
    setNationality("");
    setFoot("");
    setMinAge(15);
    setMaxAge(40);
    setMinOverall(50);
    setMinPotential(50);
    setMinHeight(150);
    setMinWeight(50);
    setMaxMarketValue(250000000);
    setMinXg(0.0);
    setMinGoals(0);
    setMinPassAccuracy(50);
    setMinProgressivePasses(0);
  };

  const toggleSection = (section: SectionType) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <aside className={`flex h-full flex-col border-l border-border/40 bg-card/75 backdrop-blur-md transition-all duration-300 ease-in-out ${
      showFilters ? "w-80 opacity-100 visible" : "w-0 opacity-0 invisible overflow-hidden"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(false)}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Collapse filters"
          >
            <X size={16} />
          </button>
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        <div className="space-y-5">
          {/* Basic Criteria Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection("basic")}
              className="flex w-full items-center justify-between font-medium text-sm hover:text-primary transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                {openSection === "basic" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Basic Information
              </div>
            </button>

            {openSection === "basic" && (
              <div className="space-y-4 pl-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    League
                  </label>
                  <select
                    value={league}
                    onChange={(e) => setLeague(e.target.value)}
                    className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Leagues</option>
                    {leagues.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Season
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Seasons</option>
                    {seasons.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Positions</option>
                    {positions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nationality
                  </label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Nationalities</option>
                    {nationalities.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Preferred Foot
                  </label>
                  <select
                    value={foot}
                    onChange={(e) => setFoot(e.target.value)}
                    className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Feet</option>
                    {feet.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <hr className="border-border" />

          {/* Profile Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection("profile")}
              className="flex w-full items-center justify-between font-medium text-sm hover:text-primary transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                {openSection === "profile" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Player Profile
              </div>
            </button>

            {openSection === "profile" && (
              <div className="space-y-4 pl-6">
                {/* Overall Rating */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Overall Rating</span>
                    <span className="font-semibold">{minOverall}</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={minOverall}
                    onChange={(e) => setMinOverall(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Potential */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Potential</span>
                    <span className="font-semibold">{minPotential}</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={minPotential}
                    onChange={(e) => setMinPotential(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Min Age */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Age</span>
                    <span className="font-semibold">{minAge} yrs</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={40}
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Max Age */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Max Age</span>
                    <span className="font-semibold">{maxAge} yrs</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={40}
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Height */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Height</span>
                    <span className="font-semibold">{minHeight} cm</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={210}
                    value={minHeight}
                    onChange={(e) => setMinHeight(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Weight</span>
                    <span className="font-semibold">{minWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={minWeight}
                    onChange={(e) => setMinWeight(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Market Value */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Max Market Value</span>
                    <span className="font-semibold">€{(maxMarketValue / 1000000).toFixed(0)}M</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={250000000}
                    step={10000000}
                    value={maxMarketValue}
                    onChange={(e) => setMaxMarketValue(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Attacking Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection("attacking")}
              className="flex w-full items-center justify-between font-medium text-sm hover:text-primary transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                {openSection === "attacking" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Attacking
              </div>
            </button>

            {openSection === "attacking" && (
              <div className="space-y-4 pl-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min xG</span>
                    <span className="font-semibold">{minXg.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={minXg}
                    onChange={(e) => setMinXg(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Goals</span>
                    <span className="font-semibold">{minGoals} goals</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={minGoals}
                    onChange={(e) => setMinGoals(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Passing Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection("passing")}
              className="flex w-full items-center justify-between font-medium text-sm hover:text-primary transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                {openSection === "passing" ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Passing
              </div>
            </button>

            {openSection === "passing" && (
              <div className="space-y-4 pl-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Pass Accuracy</span>
                    <span className="font-semibold">{minPassAccuracy}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={minPassAccuracy}
                    onChange={(e) => setMinPassAccuracy(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Min Progressive Passes</span>
                    <span className="font-semibold">{minProgressivePasses}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={minProgressivePasses}
                    onChange={(e) => setMinProgressivePasses(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm cursor-not-allowed py-1 pl-1">
            <ChevronRight size={18} />
            Advanced Analytics
          </div>
        </div>
      </div>
    </aside>
  );
}