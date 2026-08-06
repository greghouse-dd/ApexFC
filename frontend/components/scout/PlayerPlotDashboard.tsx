"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useScout } from "./ScoutContext";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";
import PlayerCard from "./PlayerCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, SlidersHorizontal, BarChart3, HelpCircle } from "lucide-react";

interface PlotFeature {
  id: string;
  label: string;
  key: string;
}

const PLOTTABLE_FEATURES: PlotFeature[] = [
  { id: "overall", label: "Overall Rating", key: "overall" },
  { id: "potential", label: "Potential Rating", key: "potential" },
  { id: "age", label: "Age", key: "age" },
  { id: "value_eur", label: "Market Value (€)", key: "marketValue" },
  { id: "wage", label: "Weekly Wage (€)", key: "wage" },
  { id: "height_cm", label: "Height (cm)", key: "height" },
  { id: "weight_kg", label: "Weight (kg)", key: "weight" },
  { id: "pace", label: "Pace", key: "pace" },
  { id: "shooting", label: "Shooting", key: "shooting" },
  { id: "passing", label: "Passing", key: "passing" },
  { id: "dribbling", label: "Dribbling", key: "dribbling" },
  { id: "defending", label: "Defending", key: "defending" },
  { id: "physical", label: "Physical", key: "physical" },
  { id: "goals", label: "Goals Scored", key: "goals" },
  { id: "xg", label: "Expected Goals (xG)", key: "xG" },
  { id: "xa", label: "Expected Assists (xA)", key: "xA" },
  { id: "tackles", label: "Tackles", key: "tackles" },
  { id: "interceptions", label: "Interceptions", key: "interceptions" },
  { id: "progressive_passes", label: "Progressive Passes", key: "progressivePasses" },
  { id: "progressive_carries", label: "Progressive Carries", key: "progressiveCarries" },
  { id: "minutes", label: "Minutes Played", key: "minutes" },
];

export default function PlayerPlotDashboard() {
  const router = useRouter();
  const {
    search,
    league,
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
    setShowFilters,
  } = useScout();

  const { collapsed } = useSidebar();

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Axis selection states
  const [xAxis, setXAxis] = useState<PlotFeature>(PLOTTABLE_FEATURES[0]); // Overall
  const [yAxis, setYAxis] = useState<PlotFeature>(PLOTTABLE_FEATURES[1]); // Potential

  // Hover and mouse position states
  const [hoveredPlayer, setHoveredPlayer] = useState<any | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const response = await api.get("/players/", {
          params: {
            page: 1,
            page_size: 100,
            search: search || undefined,
            league: league || undefined,
            nationality: nationality || undefined,
            position: position || undefined,
            min_overall: minOverall,
            max_age: maxAge,
            min_age: minAge,
            min_potential: minPotential,
            min_height: minHeight,
            min_weight: minWeight,
            max_market_value: maxMarketValue,
            min_xg: minXg || undefined,
            min_goals: minGoals || undefined,
            min_pass_accuracy: minPassAccuracy || undefined,
            min_progressive_passes: minProgressivePasses || undefined,
            foot: foot || undefined,
            sort_by: "overall",
            descending: true,
          }
        });
        if (active) {
          const mapped = (response.data.players || []).map((p: any) => ({
            id: p.fifa_id,
            name: p.name,
            photo: p.face_url || DEFAULT_AVATAR,
            nationality: p.nationality,
            nationalityFlag: p.nation_flag || "🏳️",
            club: p.club,
            clubLogo: p.club_logo || "",
            position: p.position ? p.position.split(",")[0].trim() : "",
            league: p.league || "",
            season: "2023/2024",
            age: p.age,
            foot: p.preferred_foot === "Left" ? "Left" : p.preferred_foot === "Right" ? "Right" : "Both",
            overall: p.overall,
            potential: p.potential,
            marketValue: p.value_eur || 0,
            xG: p.xg || 0,
            xA: p.xa || 0,
            goals: p.goals || 0,
            passAccuracy: p.passing || p.pass_accuracy || 0,
            height: p.height_cm || 0,
            weight: p.weight_kg || 0,
            
            // Plottable details
            pace: p.pace || 0,
            shooting: p.shooting || 0,
            passing: p.passing || 0,
            dribbling: p.dribbling || 0,
            defending: p.defending || 0,
            physical: p.physical || 0,
            wage: p.wage_eur || 0,
            releaseClause: p.release_clause || 0,
            tackles: p.tackles || 0,
            interceptions: p.interceptions || 0,
            progressivePasses: p.progressive_passes || 0,
            progressiveCarries: p.progressive_carries || 0,
            minutes: p.minutes || 0,
          }));
          setPlayers(mapped);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          console.error("Error fetching players for plot:", err);
          setError(err.message || "Failed to load players.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchPlayers();
    return () => {
      active = false;
    };
  }, [
    search,
    league,
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
  ]);

  // Dot color by position group
  const getDotColor = (position: string) => {
    const pos = position.toUpperCase();
    if (pos === "GK") return "#f59e0b"; // Amber
    if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) return "#3b82f6"; // Sky Blue
    if (["CM", "CDM", "CAM", "LM", "RM"].includes(pos)) return "#10b981"; // Emerald
    return "#ef4444"; // Forwards / Wingers (ST, CF, LW, RW)
  };

  // Dimensions & Scale Calculations
  const svgWidth = 800;
  const svgHeight = 480;
  const margin = { top: 40, right: 40, bottom: 60, left: 75 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Extract features range
  const getFeatureVal = (player: any, feature: PlotFeature): number => {
    return player[feature.key] || 0;
  };

  const xVals = players.map(p => getFeatureVal(p, xAxis));
  const yVals = players.map(p => getFeatureVal(p, yAxis));

  // Determine scaling boundaries dynamically
  const getBounds = (vals: number[], padPercent = 0.05) => {
    if (vals.length === 0) return { min: 0, max: 100 };
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    const delta = maxVal - minVal || 1;
    return {
      min: Math.max(0, minVal - delta * padPercent),
      max: maxVal + delta * padPercent
    };
  };

  const xBounds = getBounds(xVals);
  const yBounds = getBounds(yVals);

  const getXPixel = (val: number) => {
    const range = xBounds.max - xBounds.min || 1;
    return margin.left + ((val - xBounds.min) / range) * plotWidth;
  };

  const getYPixel = (val: number) => {
    const range = yBounds.max - yBounds.min || 1;
    return margin.top + (1 - (val - yBounds.min) / range) * plotHeight;
  };

  const generateTicks = (min: number, max: number, count = 5) => {
    const ticks = [];
    const step = (max - min) / (count - 1);
    for (let i = 0; i < count; i++) {
      ticks.push(min + step * i);
    }
    return ticks;
  };

  const xTicks = generateTicks(xBounds.min, xBounds.max);
  const yTicks = generateTicks(yBounds.min, yBounds.max);

  const formatTickLabel = (val: number, feature: PlotFeature) => {
    if (feature.id === "value_eur" || feature.id === "wage" || feature.id === "releaseClause") {
      if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
      return `€${val}`;
    }
    return val.toFixed(0);
  };

  const hoveredCx = hoveredPlayer ? getXPixel(getFeatureVal(hoveredPlayer, xAxis)) : 0;
  const hoveredCy = hoveredPlayer ? getYPixel(getFeatureVal(hoveredPlayer, yAxis)) : 0;

  // Get active filter labels
  const getActiveFiltersText = () => {
    const items = [];
    if (position) items.push(`Position: ${position}`);
    if (league) items.push(`League: ${league}`);
    if (nationality) items.push(`Nation: ${nationality}`);
    if (minOverall > 0) items.push(`Overall >= ${minOverall}`);
    if (minPotential > 0) items.push(`Potential >= ${minPotential}`);
    if (search) items.push(`Search: "${search}"`);
    return items.length > 0 ? items.join(" • ") : "All Registered Players";
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Player Plot</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Compare squad candidates dynamically across multiple stats. Filter using the sidebar dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-xs font-semibold cursor-pointer border-border hover:bg-muted"
          >
            <SlidersHorizontal size={14} />
            Filters {showFilters ? "Open" : "Closed"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: SVG Chart Dashboard (takes 3 cols) */}
        <div className="xl:col-span-3 p-6 bg-card/60 backdrop-blur-md border border-border/40 rounded-xl flex flex-col space-y-6 relative overflow-visible shadow-sm" ref={containerRef}>
          
          {/* Plot Information Label Header */}
          <div className="flex justify-between items-start border-b border-border/60 pb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                {yAxis.label} vs {xAxis.label}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                {getActiveFiltersText()}
              </p>
            </div>
            
            {/* Chart Legend */}
            <div className="flex flex-wrap gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ef4444" }}></span> Forwards</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10b981" }}></span> Midfielders</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#3b82f6" }}></span> Defenders</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#f59e0b" }}></span> Goalkeepers</span>
            </div>
          </div>

          {loading ? (
            <div className="h-[480px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Loading and plotting squad database...</span>
              </div>
            </div>
          ) : players.length === 0 ? (
            <div className="h-[480px] flex flex-col items-center justify-center gap-3 text-center p-6">
              <p className="text-sm font-semibold text-muted-foreground">No players match the chosen filters.</p>
              <p className="text-xs text-muted-foreground max-w-xs">Adjust your search terms or range sliders in the filter panel.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="w-full h-auto overflow-visible select-none"
              >
                {/* SVG definitions for grid glow/blur (aesthetically pleasing details) */}
                <defs>
                  <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Grid Axes Lines */}
                <g opacity="0.3">
                  {/* Horizontal Y Ticks Grid Lines */}
                  {yTicks.map((tick, idx) => {
                    const y = getYPixel(tick);
                    return (
                      <g key={`y-grid-${idx}`}>
                        <line 
                          x1={margin.left} 
                          y1={y} 
                          x2={svgWidth - margin.right} 
                          y2={y} 
                          stroke="var(--border)" 
                          strokeWidth="0.8" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={margin.left - 12} 
                          y={y + 4} 
                          fill="var(--muted-foreground)" 
                          fontSize="10" 
                          fontWeight="bold" 
                          textAnchor="end"
                        >
                          {formatTickLabel(tick, yAxis)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical X Ticks Grid Lines */}
                  {xTicks.map((tick, idx) => {
                    const x = getXPixel(tick);
                    return (
                      <g key={`x-grid-${idx}`}>
                        <line 
                          x1={x} 
                          y1={margin.top} 
                          x2={x} 
                          y2={svgHeight - margin.bottom} 
                          stroke="var(--border)" 
                          strokeWidth="0.8" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={x} 
                          y={svgHeight - margin.bottom + 18} 
                          fill="var(--muted-foreground)" 
                          fontSize="10" 
                          fontWeight="bold" 
                          textAnchor="middle"
                        >
                          {formatTickLabel(tick, xAxis)}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Solid Axis lines */}
                <g stroke="var(--border)" strokeWidth="1.2">
                  {/* Y Axis line */}
                  <line x1={margin.left} y1={margin.top} x2={margin.left} y2={svgHeight - margin.bottom} />
                  {/* X Axis line */}
                  <line x1={margin.left} y1={svgHeight - margin.bottom} x2={svgWidth - margin.right} y2={svgHeight - margin.bottom} />
                </g>

                {/* Axis Labels */}
                <text 
                  x={margin.left + plotWidth / 2} 
                  y={svgHeight - margin.bottom + 42} 
                  fill="var(--foreground)" 
                  fontSize="11" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  {xAxis.label}
                </text>
                <text 
                  x={18} 
                  y={margin.top + plotHeight / 2} 
                  fill="var(--foreground)" 
                  fontSize="11" 
                  fontWeight="bold" 
                  textAnchor="middle"
                  transform={`rotate(-90 18 ${margin.top + plotHeight / 2})`}
                >
                  {yAxis.label}
                </text>

                {/* Hover tracer grid helpers */}
                {hoveredPlayer && (
                  <g>
                    {/* Dotted tracer lines to axes */}
                    <line 
                      x1={margin.left} 
                      y1={hoveredCy} 
                      x2={hoveredCx} 
                      y2={hoveredCy} 
                      stroke="var(--primary)" 
                      strokeWidth="1.2" 
                      strokeDasharray="3 3" 
                      opacity="0.8"
                    />
                    <line 
                      x1={hoveredCx} 
                      y1={hoveredCy} 
                      x2={hoveredCx} 
                      y2={svgHeight - margin.bottom} 
                      stroke="var(--primary)" 
                      strokeWidth="1.2" 
                      strokeDasharray="3 3" 
                      opacity="0.8"
                    />
                    
                    {/* Glow circle behind hovered dot */}
                    <circle 
                      cx={hoveredCx} 
                      cy={hoveredCy} 
                      r="16" 
                      fill="url(#dotGlow)" 
                    />
                  </g>
                )}

                {/* Player Dots Rendering */}
                {players.map((p) => {
                  const xVal = getFeatureVal(p, xAxis);
                  const yVal = getFeatureVal(p, yAxis);
                  const cx = getXPixel(xVal);
                  const cy = getYPixel(yVal);
                  const color = getDotColor(p.position);
                  const isHovered = hoveredPlayer?.id === p.id;

                  return (
                    <circle
                      key={p.id}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 8 : 5}
                      fill={color}
                      stroke="var(--background)"
                      strokeWidth={isHovered ? 2.5 : 1}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => router.push(`/analytics?id=${p.id}`)}
                      onMouseEnter={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setMouseCoords({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          });
                          setHoveredPlayer(p);
                        }
                      }}
                      onMouseMove={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setMouseCoords({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredPlayer(null);
                        setMouseCoords(null);
                      }}
                    />
                  );
                })}
              </svg>
            </div>
          )}

          {/* Hover popup floating player card */}
          {hoveredPlayer && mouseCoords && (
            <div 
              className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
              style={{
                left: `${mouseCoords.x + 300 > containerWidth ? mouseCoords.x - 280 : mouseCoords.x + 15}px`,
                top: `${Math.max(10, mouseCoords.y - 90)}px`,
                width: "260px"
              }}
            >
              <Card className="shadow-2xl border border-primary/40 bg-card p-3 rounded-xl overflow-hidden text-left relative pointer-events-none">
                {/* Floating View Profile indicator */}
                <div className="absolute top-2 right-2 text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                  Click dot to inspect
                </div>
                
                {/* Player details */}
                <div className="flex gap-3 items-center">
                  <img 
                    src={hoveredPlayer.photo || DEFAULT_AVATAR} 
                    alt={hoveredPlayer.name}
                    className="w-12 h-12 rounded-full border border-border object-cover bg-muted"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <div>
                    <h4 className="font-extrabold text-sm truncate max-w-[140px] text-foreground">
                      {hoveredPlayer.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <span>{hoveredPlayer.nationalityFlag}</span>
                      <span>{hoveredPlayer.position} • {hoveredPlayer.club}</span>
                    </p>
                  </div>
                </div>

                <hr className="my-2.5 border-border/80" />

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-medium text-muted-foreground">
                  <div>Age: <span className="font-semibold text-foreground">{hoveredPlayer.age}</span></div>
                  <div>Foot: <span className="font-semibold text-foreground">{hoveredPlayer.foot}</span></div>
                  <div>Overall: <span className="font-bold text-primary">{hoveredPlayer.overall}</span></div>
                  <div>Potential: <span className="font-bold text-accent">{hoveredPlayer.potential}</span></div>
                  
                  <div className="col-span-2">
                    Value: <span className="font-semibold text-foreground">
                      {hoveredPlayer.marketValue >= 1000000
                        ? `€${(hoveredPlayer.marketValue / 1000000).toFixed(1)}M`
                        : hoveredPlayer.marketValue >= 1000
                          ? `€${(hoveredPlayer.marketValue / 1000).toFixed(0)}K`
                          : `€${hoveredPlayer.marketValue}`}
                    </span>
                  </div>
                </div>

                {/* Show values of chosen axes */}
                <div className="mt-2.5 pt-2 border-t border-border/50 text-[10px] space-y-0.5 bg-muted/20 p-1.5 rounded-lg">
                  <div className="truncate"><span className="text-muted-foreground">{xAxis.label}:</span> <span className="font-bold text-foreground">{formatTickLabel(getFeatureVal(hoveredPlayer, xAxis), xAxis)}</span></div>
                  <div className="truncate"><span className="text-muted-foreground">{yAxis.label}:</span> <span className="font-bold text-foreground">{formatTickLabel(getFeatureVal(hoveredPlayer, yAxis), yAxis)}</span></div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right Side: Axis Control Panel (takes 1 col) */}
        <div className="space-y-6">
          <Card className="p-5 border border-border/40 bg-card/75 backdrop-blur-md flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              Axis Configuration
            </h3>
            
            {/* X Axis Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground">X-Axis Feature</label>
              <select
                value={xAxis.id}
                onChange={(e) => {
                  const feat = PLOTTABLE_FEATURES.find(f => f.id === e.target.value);
                  if (feat) setXAxis(feat);
                }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-semibold outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                {PLOTTABLE_FEATURES.map((feat) => (
                  <option key={feat.id} value={feat.id}>
                    {feat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Y Axis Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground">Y-Axis Feature</label>
              <select
                value={yAxis.id}
                onChange={(e) => {
                  const feat = PLOTTABLE_FEATURES.find(f => f.id === e.target.value);
                  if (feat) setYAxis(feat);
                }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-semibold outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
              >
                {PLOTTABLE_FEATURES.map((feat) => (
                  <option key={feat.id} value={feat.id}>
                    {feat.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Quick Statistics details */}
          <Card className="p-5 border border-border/40 bg-card/75 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              Plot statistics
            </h3>

            <div className="divide-y divide-border/60 text-xs space-y-2.5">
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Players plotted</span>
                <span className="font-bold text-foreground">{players.length}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Average OVR</span>
                <span className="font-bold text-foreground">
                  {players.length > 0
                    ? (players.reduce((acc, p) => acc + p.overall, 0) / players.length).toFixed(1)
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Average POT</span>
                <span className="font-bold text-foreground">
                  {players.length > 0
                    ? (players.reduce((acc, p) => acc + p.potential, 0) / players.length).toFixed(1)
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Average Age</span>
                <span className="font-bold text-foreground">
                  {players.length > 0
                    ? (players.reduce((acc, p) => acc + p.age, 0) / players.length).toFixed(1)
                    : "N/A"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
