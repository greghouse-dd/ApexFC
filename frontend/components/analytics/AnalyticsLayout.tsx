"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import PlayerSearch from "./PlayerSearch";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Search, UserCheck, Sparkles, X, Loader2, ArrowLeftRight, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";

type MainTab = "Physical" | "Attacking" | "Defensive & Mental" | "Goalkeeping";
type SubTab = "Percentiles" | "Radar";

export default function AnalyticsLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get("id");

  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<MainTab>("Attacking");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("Percentiles");
  const [isAddedToSquad, setIsAddedToSquad] = useState(false);
  const { user } = useAuth();
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Comparison State
  const [mode, setMode] = useState<"stats" | "compare">("stats");
  const [comparePlayer, setComparePlayer] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareQuery, setCompareQuery] = useState("");
  const [compareResults, setCompareResults] = useState<any[]>([]);
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);

  // Source player search states (for Player 1 Compare target)
  const [compareSource, setCompareSource] = useState<any>(null);
  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceResults, setSourceResults] = useState<any[]>([]);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  // Stats tab search query states (for stats empty state search input)
  const [statsQuery, setStatsQuery] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsResults, setStatsResults] = useState<any[]>([]);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);

  useEffect(() => {
    if (player) {
      setCompareSource(player);
    }
  }, [player]);

  const handleCompareSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompareQuery(val);
    if (val.trim().length < 2) {
      setCompareResults([]);
      setShowCompareDropdown(false);
      return;
    }
    setCompareLoading(true);
    try {
      const response = await api.get("/players/", {
        params: { search: val, page_size: 6 }
      });
      setCompareResults(response.data.players || []);
      setShowCompareDropdown(true);
    } catch (err) {
      console.error(err);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSelectComparePlayer = async (id: number) => {
    setCompareLoading(true);
    setShowCompareDropdown(false);
    try {
      const response = await api.get(`/players/${id}`);
      const selectedPlayer = response.data;

      const isTargetGk = player.position?.split(",")[0].trim().toUpperCase() === "GK";
      const isSelectedGk = selectedPlayer.position?.split(",")[0].trim().toUpperCase() === "GK";

      if (isTargetGk !== isSelectedGk) {
        toast.error(
          isTargetGk
            ? "Cannot compare a Goalkeeper with a field player!"
            : "Cannot compare a field player with a Goalkeeper!"
        );
        setCompareQuery("");
        return;
      }

      setComparePlayer(selectedPlayer);
      setCompareQuery("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load comparison player details");
    } finally {
      setCompareLoading(false);
    }
  };

  useEffect(() => {
    const loadPlayer = async () => {
      let activeId = playerId;
      if (!activeId && typeof window !== "undefined") {
        const lastViewed = localStorage.getItem("lastViewedPlayerId");
        if (lastViewed) {
          router.replace(`/analytics?id=${lastViewed}`);
          return;
        }
      }

      if (!activeId) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const detailRes = await api.get(`/players/${activeId}`);
        const pData = detailRes.data;
        setPlayer(pData);
        if (typeof window !== "undefined") {
          localStorage.setItem("lastViewedPlayerId", activeId);
        }
        setError(null);
        setIsAddedToSquad(pData.in_squad || false);
        const isGk = pData.position?.split(",")[0].trim().toUpperCase() === "GK";
        setActiveTab(isGk ? "Goalkeeping" : "Attacking");
      } catch (err: any) {
        console.error("Error loading player:", err);
        setError(err.message || "Failed to load player statistics.");
        setPlayer(null);
      } finally {
        setLoading(false);
      }
    };
    loadPlayer();
  }, [playerId]);

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!user || !player) return;
      try {
        const pid = player.fifa_id || player.id;
        const res = await api.get(`/watchlist/check/${user.id}/${pid}`);
        setIsWatchlisted(res.data.watchlisted);
      } catch (err) {
        console.error("Error checking watchlist:", err);
      }
    };
    checkWatchlistStatus();
  }, [user, player]);

  const handleToggleWatchlist = async () => {
    if (!user || !player) {
      toast.error("Please login to manage watchlist.");
      return;
    }
    const pid = player.fifa_id || player.id;
    try {
      if (isWatchlisted) {
        await api.delete(`/watchlist/${pid}`, { params: { user_id: user.id } });
        setIsWatchlisted(false);
        toast.success(`${player.name} removed from watchlist.`);
      } else {
        await api.post("/watchlist/", {
          user_id: user.id,
          player_id: pid,
          notes: ""
        });
        setIsWatchlisted(true);
        toast.success(`${player.name} added to watchlist!`);
      }
    } catch (err) {
      console.error("Error toggling watchlist:", err);
      toast.error("Failed to update watchlist.");
    }
  };

  const handleStatsSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStatsQuery(val);
    if (val.trim().length < 2) {
      setStatsResults([]);
      setShowStatsDropdown(false);
      return;
    }
    setStatsLoading(true);
    try {
      const response = await api.get("/players/", {
        params: { search: val, page_size: 6 }
      });
      setStatsResults(response.data.players || []);
      setShowStatsDropdown(true);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSourceSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSourceQuery(val);
    if (val.trim().length < 2) {
      setSourceResults([]);
      setShowSourceDropdown(false);
      return;
    }
    setSourceLoading(true);
    try {
      const response = await api.get("/players/", {
        params: { search: val, page_size: 6 }
      });
      setSourceResults(response.data.players || []);
      setShowSourceDropdown(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSourceLoading(false);
    }
  };

  const handleSelectSourcePlayer = async (id: number) => {
    setSourceLoading(true);
    setShowSourceDropdown(false);
    try {
      const response = await api.get(`/players/${id}`);
      const selectedPlayer = response.data;
      if (comparePlayer) {
        const isSourceGk = selectedPlayer.position?.split(",")[0].trim().toUpperCase() === "GK";
        const isCompareGk = comparePlayer.position?.split(",")[0].trim().toUpperCase() === "GK";
        if (isSourceGk !== isCompareGk) {
          toast.error(
            isSourceGk
              ? "Cannot compare a Goalkeeper with a field player!"
              : "Cannot compare a field player with a Goalkeeper!"
          );
          setSourceQuery("");
          return;
        }
      }
      setCompareSource(selectedPlayer);
      setSourceQuery("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load source player details");
    } finally {
      setSourceLoading(false);
    }
  };

  // Categories mapping
  const attributeCategories: Record<MainTab, string[]> = {
    Attacking: [
      "crossing", "finishing", "heading_accuracy", "short_passing", "volleys",
      "dribbling", "curve", "freekick_accuracy", "long_passing", "ball_control",
      "positioning", "vision", "penalties", "long_shots"
    ],
    Goalkeeping: [
      "gk_diving", "gk_handling", "gk_kicking", "gk_reflexes", "gk_positioning"
    ],
    Physical: [
      "acceleration", "sprint_speed", "agility", "balance",
      "jumping", "stamina", "strength", "reactions"
    ],
    "Defensive & Mental": [
      "interceptions", "aggression", "marking",
      "standing_tackle", "sliding_tackle", "composure"
    ]
  };

  const getAttributeLabel = (key: string): string => {
    return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace("Gk ", "GK ");
  };

  const FORMATION_LABELS: Record<string, string[]> = {
    "4-4-2": ["GK", "LB", "LCB", "RCB", "RB", "LM", "LCM", "RCM", "RM", "LS", "RS"],
    "4-3-3": ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CDM", "RCM", "LW", "ST", "RW"],
    "3-5-2": ["GK", "LCB", "CB", "RCB", "LWB", "RWB", "LCM", "CDM", "RCM", "LS", "RS"],
    "3-4-3": ["GK", "LCB", "CB", "RCB", "LM", "LCM", "RCM", "RM", "LW", "ST", "RW"],
    "4-2-3-1": ["GK", "LB", "LCB", "RCB", "RB", "LDM", "RDM", "LAM", "CAM", "RAM", "ST"],
    "5-3-2": ["GK", "LWB", "LCB", "CB", "RCB", "RWB", "LCM", "CM", "RCM", "LS", "RS"],
    "5-4-1": ["GK", "LWB", "LCB", "CB", "RCB", "RWB", "LM", "LCM", "RCM", "RM", "ST"]
  };

  const getPlayerCategory = (pos: string) => {
    const p = pos.toUpperCase();
    if (p === "GK") return "GK";
    if (["CB", "LCB", "RCB", "LB", "RB", "LWB", "RWB", "DEF"].includes(p)) return "DEF";
    if (["CM", "CDM", "CAM", "LM", "RM", "LDM", "RDM", "LAM", "RAM", "MID"].includes(p)) return "MID";
    if (["ST", "CF", "LW", "RW", "LS", "RS", "FWD", "ATT"].includes(p)) return "FWD";
    return "MID";
  };

  const getSlotMatchScore = (slotLabel: string, playerPos: string) => {
    const sLabel = slotLabel.toUpperCase();
    const pPos = playerPos.toUpperCase();
    if (sLabel === pPos) return 10;
    const sCat = getPlayerCategory(sLabel);
    const pCat = getPlayerCategory(pPos);
    if (sCat === pCat) return 8;
    return 0;
  };

  const handleAddToSquad = async () => {
    if (!user) {
      toast.error("Please login to manage the squad.");
      return;
    }
    if (!player) return;

    const pid = player.fifa_id || player.id;

    try {
      // 1. Get user squad summary
      const listRes = await api.get("/squads/", { params: { user_id: user.id } });
      let squadSummary = listRes.data?.[0];

      // Create default squad if none exists
      if (!squadSummary) {
        const createRes = await api.post(`/squads/?user_id=${user.id}`, {
          squad_name: "First Team",
          formation: "4-4-2"
        });
        squadSummary = createRes.data;
      }

      // 1b. Fetch detailed squad to populate players list
      const detailRes = await api.get(`/squads/${squadSummary.id}`);
      const squad = detailRes.data;

      // If already in squad, perform deletion
      if (isAddedToSquad) {
        await api.delete(`/squads/${squad.id}/players/${pid}`);
        setIsAddedToSquad(false);
        window.dispatchEvent(new Event("squad-updated"));
        toast.success(`${player.name} removed from scouting squad.`);
        return;
      }

      // 2. Identify the matching slots on the pitch
      const formationName = squad.formation || "4-4-2";
      const labels = FORMATION_LABELS[formationName] || FORMATION_LABELS["4-4-2"];
      const primaryPos = (player.position || "CM").split(",")[0].trim().toUpperCase();

      const scoredSlots = labels
        .map((label, idx) => ({
          index: idx,
          label,
          score: getSlotMatchScore(label, primaryPos)
        }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      let assignedPosition: string | null = null;
      const isPositionOccupied = (posKey: string) => squad.players.some((sp: any) => sp.position === posKey);

      for (const slot of scoredSlots) {
        const idx = slot.index;
        // Check Starter slot (String(idx) or index_0)
        const isStarterOccupied = isPositionOccupied(String(idx)) || isPositionOccupied(`${idx}_0`);
        if (!isStarterOccupied) {
          assignedPosition = `${idx}_0`;
          break;
        }
        // Check Sub 1
        if (!isPositionOccupied(`${idx}_1`)) {
          assignedPosition = `${idx}_1`;
          break;
        }
        // Check Sub 2
        if (!isPositionOccupied(`${idx}_2`)) {
          assignedPosition = `${idx}_2`;
          break;
        }
      }

      if (assignedPosition) {
        await api.post(`/squads/${squad.id}/players`, {
          player_id: pid,
          position: assignedPosition
        });
        setIsAddedToSquad(true);
        setIsWatchlisted(false);
        window.dispatchEvent(new Event("squad-updated"));
        const slotLabel = labels[parseInt(assignedPosition.split("_")[0])];
        const isStarter = assignedPosition.endsWith("_0");
        const subIndexStr = isStarter ? "Starter" : `Sub ${assignedPosition.split("_")[1]}`;
        toast.success(`${player.name} added to squad as ${slotLabel} (${subIndexStr})!`);
      } else {
        toast.warning(`Position already filled. No empty Starter or Sub slots for ${primaryPos} on the pitch.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to add player to squad. Check remaining budget.");
    }
  };

  // Potential Chart Path Generator
  const generatePotentialChartPath = () => {
    if (!player) {
      return {
        path: "",
        currentX: 20,
        currentY: 130,
        startAge: 16,
        endAge: 38
      };
    }
    const currentAge = Math.max(16, Math.min(38, Number(player.age) || 22));
    const startAge = 16;
    
    // Determine if player has growth potential left
    const hasGrowth = (player.potential || 0) > (player.overall || 0);
    
    // Peak age is in the future if they still have growth, otherwise they are already at their peak
    const peakAge = hasGrowth 
      ? Math.max(27, currentAge + 2) 
      : Math.max(27, currentAge);
      
    const endAge = Math.max(38, peakAge + 5);

    const startOvr = Math.min(50, (player.overall || 75) - 15);
    const currentOvr = player.overall || 75;
    const peakOvr = Math.max(player.potential || 80, currentOvr);
    const endOvr = Math.max(55, currentOvr - 15);

    const getX = (age: number) => ((age - startAge) / (endAge - startAge)) * 240 + 20;
    const getY = (ovr: number) => 130 - ((ovr - 40) / 60) * 110;

    let points = [];
    for (let age = startAge; age <= endAge; age++) {
      let ovr = currentOvr;
      if (age < currentAge) {
        // Grow from startAge to currentAge
        const t = (age - startAge) / (currentAge - startAge);
        ovr = startOvr + (currentOvr - startOvr) * (2 * t - t * t);
      } else if (age < peakAge) {
        // Grow from currentAge to peakAge (potential)
        const t = (age - currentAge) / (peakAge - currentAge);
        ovr = currentOvr + (peakOvr - currentOvr) * (3 * t * t - 2 * t * t * t);
      } else {
        // Decline from peakAge to endAge
        const t = (age - peakAge) / (endAge - peakAge);
        ovr = peakOvr - (peakOvr - endOvr) * (t * t);
      }
      points.push(`${getX(age)},${getY(ovr)}`);
    }

    return {
      path: `M ${points.join(" L ")}`,
      currentX: getX(currentAge),
      currentY: getY(currentOvr),
      startAge,
      endAge
    };
  };

  const { path: potentialPath, currentX, currentY, startAge, endAge } = generatePotentialChartPath();

  // Shot Map Event Generator (equivalent to Streamlit attribute-driven shot mapping logic)
  const generateShotMapEvents = () => {
    if (!player) return [];
    
    const id = player.fifa_id || player.id || 1;
    const isGk = player.position?.split(",")[0].trim().toUpperCase() === "GK";
    
    // Seeded Random Generator (LCG)
    let s = id % 2147483647;
    if (s <= 0) s += 2147483646;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    const normalDist = (mean: number, std: number) => {
      const u1 = rand();
      const u2 = rand();
      const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
      return z0 * std + mean;
    };

    if (isGk) return [];
    const shooting = player.shooting || 65;
    const apps = player.appearances || 20;
    const shotsP90 = shooting / 22; // Estimate shots per 90 (ranges from ~2.2 to ~4.5)
    
    const nShots = Math.max(4, Math.min(40, Math.round((shotsP90 * apps) / 3.5)));
    const shotsList = [];
    const qualityBias = (shooting - 50) / 100; // range from -0.5 to 0.5

    for (let i = 0; i < nShots; i++) {
      const dist = rand() * 24 * (1 - qualityBias * 0.35) + 6;
      const angle = normalDist(0, 20);
      
      let x = 120 - dist;
      let y = 40 + dist * Math.tan((angle * Math.PI) / 180) * 0.6;
      
      y = Math.max(2, Math.min(78, y));
      x = Math.max(78, Math.min(119, x));
      
      const xgVal = Math.max(0.02, Math.min(0.95, (qualityBias + 0.5) * (rand() * 0.7 + 0.3) * (1 - dist / 40)));
      const isGoal = rand() < (xgVal * 0.85);
      
      shotsList.push({
        x,
        y,
        xg: Number(xgVal.toFixed(2)),
        goal: isGoal
      });
    }
    return shotsList;
  };

  const shots = generateShotMapEvents();
  const totalXg = shots.reduce((sum: number, s: any) => sum + s.xg, 0);
  const goalsCount = shots.filter((s: any) => s.goal).length;
  const conversionRate = shots.length > 0 ? ((goalsCount / shots.length) * 100).toFixed(1) : "0";

  // Heatmap Event Generator (equivalent to Streamlit Box-Muller touch density mapping logic)
  const generateHeatmapPoints = () => {
    if (!player) return [];
    
    const id = player.fifa_id || player.id || 1;
    
    // Seeded Random Generator (LCG) - shifted to avoid exact overlap with shot map LCG sequence
    let s = (id + 500) % 2147483647;
    if (s <= 0) s += 2147483646;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    const normalDist = (mean: number, std: number) => {
      const u1 = rand();
      const u2 = rand();
      const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
      return z0 * std + mean;
    };

    const zones: Record<string, [number, number]> = {
      "ST": [0.5, 0.18], "CF": [0.5, 0.22], "LW": [0.18, 0.32], "RW": [0.82, 0.32],
      "CAM": [0.5, 0.38], "CM": [0.5, 0.5], "CDM": [0.5, 0.62], "LM": [0.18, 0.5], "RM": [0.82, 0.5],
      "CB": [0.5, 0.82], "LB": [0.15, 0.72], "RB": [0.85, 0.72], "LWB": [0.15, 0.62], "RWB": [0.85, 0.62],
      "GK": [0.5, 0.95],
    };

    const pos = player.position?.split(",")[0].trim().toUpperCase() || "CM";
    const [cxN, cyN] = zones[pos] || [0.5, 0.5];
    const cx = cxN * 80;
    const cy = (1 - cyN) * 120; // vertical pitch, y inverted

    const nPoints = 140; // Dense touch coordinates
    const pace = player.pace || 70;
    const spreadX = 12 + (pace / 100) * 8; // higher pace -> wider range
    const spreadY = 18;

    const pointsList = [];
    for (let i = 0; i < nPoints; i++) {
      const hx = Math.max(1, Math.min(79, normalDist(cx, spreadX)));
      const hy = Math.max(1, Math.min(119, normalDist(cy, spreadY)));
      
      const svgX = 15 + (hx / 80) * 190;
      const svgY = 285 - (hy / 120) * 270;
      
      pointsList.push({
        x: svgX,
        y: svgY,
        r: 10 + rand() * 8
      });
    }
    
    return pointsList;
  };

  const heatmapPoints = generateHeatmapPoints();

  // Radar chart calculations
  const generateRadarPoints = () => {
    if (!player) {
      return {
        polygonPath: "",
        labels: [],
        webPaths: []
      };
    }
    let metrics = [];
    if (activeTab === "Attacking") {
      metrics = [
        { name: "Crossing", value: player.crossing || 50 },
        { name: "Finishing", value: player.finishing || 50 },
        { name: "Short Pass", value: player.short_passing || 50 },
        { name: "Dribbling", value: player.dribbling || 50 },
        { name: "Volleys", value: player.volleys || 50 },
        { name: "Long Shots", value: player.long_shots || 50 }
      ];
    } else if (activeTab === "Goalkeeping") {
      metrics = [
        { name: "Diving", value: player.gk_diving || 50 },
        { name: "Handling", value: player.gk_handling || 50 },
        { name: "Kicking", value: player.gk_kicking || 50 },
        { name: "Reflexes", value: player.gk_reflexes || 50 },
        { name: "Positioning", value: player.gk_positioning || 50 },
        { name: "Speed", value: player.pace || 50 }
      ];
    } else if (activeTab === "Physical") {
      metrics = [
        { name: "Accel.", value: player.acceleration || 50 },
        { name: "Sprint", value: player.sprint_speed || 50 },
        { name: "Agility", value: player.agility || 50 },
        { name: "Balance", value: player.balance || 50 },
        { name: "Stamina", value: player.stamina || 50 },
        { name: "Strength", value: player.strength || 50 }
      ];
    } else { // Defensive & Mental
      metrics = [
        { name: "Intercept.", value: player.interceptions || 50 },
        { name: "Aggression", value: player.aggression || 50 },
        { name: "Marking", value: player.marking || 50 },
        { name: "Stand Tackle", value: player.standing_tackle || 50 },
        { name: "Slide Tackle", value: player.sliding_tackle || 50 },
        { name: "Composure", value: player.composure || 50 }
      ];
    }

    const cx = 150;
    const cy = 150;
    const r = 90;

    const points = metrics.map((m, idx) => {
      const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
      const valPercent = m.value / 100;
      const x = cx + r * valPercent * Math.cos(angle);
      const y = cy + r * valPercent * Math.sin(angle);
      return { x, y, name: m.name, angle, value: m.value };
    });

    return {
      polygonPath: points.map(p => `${p.x},${p.y}`).join(" "),
      labels: points,
      webPaths: Array.from({ length: 5 }).map((_, step) => {
        const factor = (step + 1) / 5;
        return points.map((_, idx) => {
          const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
          const x = cx + r * factor * Math.cos(angle);
          const y = cy + r * factor * Math.sin(angle);
          return `${x},${y}`;
        }).join(" ");
      })
    };
  };

  const radarData = generateRadarPoints();

  return (
    <div 
      className="min-h-screen bg-background text-foreground flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/images/analytics/analytics-1.jpg')" }}
    >
      {/* Dark overlay for contrast and readability */}
      <div className="absolute inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none" />

      <div className="min-h-screen flex flex-col relative z-10 w-full">
        {/* Sub-header navigation (Player Stats & Compare Players) */}
        <div className="border-b border-border/40 bg-card/75 backdrop-blur-md flex w-full h-14 z-30">
        <button
          onClick={() => setMode("stats")}
          className={`flex-1 text-sm font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${mode === "stats"
              ? "border-primary text-primary bg-primary/5 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/5"
            }`}
        >
          Player Stats
        </button>
        <button
          onClick={() => setMode("compare")}
          className={`flex-1 text-sm font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${mode === "compare"
              ? "border-primary text-primary bg-primary/5 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/5"
            }`}
        >
          Compare Players
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : mode === "stats" ? (
        player ? (
          /* 3-Column Layout */
          <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">

            {/* COLUMN 1: LEFT SIDEBAR (Player Profile Details & Potential Curve) */}
            <aside className="w-full xl:w-80 border-r border-border/40 bg-card/75 backdrop-blur-md overflow-y-auto flex flex-col p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg relative group overflow-hidden">
                  <img
                    src={player.face_url || DEFAULT_AVATAR}
                    alt={player.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <AvatarFallback className="text-3xl font-bold">
                    {player.name ? player.name.substring(0, 2).toUpperCase() : "PL"}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">{player.name}</h2>
                  <p className="text-sm font-medium text-primary">{player.position?.split(",")[0] || "Unknown"}</p>
                </div>

                <Button
                  onClick={handleAddToSquad}
                  variant={isAddedToSquad ? "outline" : "default"}
                  className="w-full transition-all duration-300 font-semibold gap-2"
                >
                  {isAddedToSquad ? (
                    <>
                      <UserCheck className="h-4 w-4 text-emerald-500 animate-pulse" />
                      In Scouting Squad
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Add To Squad
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleToggleWatchlist}
                  variant={isWatchlisted ? "outline" : "default"}
                  className="w-full transition-all duration-300 font-semibold gap-2 border-primary/20 cursor-pointer"
                >
                  {isWatchlisted ? (
                    <>
                      <Bookmark className="h-4 w-4 text-primary fill-primary animate-pulse" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      Add to Watchlist
                    </>
                  )}
                </Button>
              </div>

              <hr className="border-border" />

              {/* Player Info List */}
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Age</span><span className="font-semibold">{player.age} yrs</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Club</span><span className="font-semibold text-right">{player.club || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">League</span><span className="font-semibold text-right text-xs truncate max-w-[180px]">{player.league || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Nationality</span><span className="font-semibold text-right">{player.nationality || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Preferred Foot</span><span className="font-semibold">{player.preferred_foot || "Right"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Height</span><span className="font-semibold">{player.height_cm || 180} cm</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Weight</span><span className="font-semibold">{player.weight_kg || 75} kg</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Release Clause</span>
                  <span className="font-semibold text-emerald-500">
                    {player.release_clause ? `€${(player.release_clause / 1000000).toFixed(1)}M` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Minutes Played</span><span className="font-semibold">{player.minutes || 0} mins</span></div>
              </div>

              <hr className="border-border" />

              {/* Player Potential vs Age Chart */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Player Potential vs Age</h3>
                <div className="bg-background rounded-xl p-3 border border-border flex items-center justify-center">
                  <svg width="260" height="150" className="overflow-visible">
                    {/* Gridlines */}
                    <line x1="20" y1="30" x2="260" y2="30" stroke="var(--border)" strokeDasharray="3,3" />
                    <line x1="20" y1="80" x2="260" y2="80" stroke="var(--border)" strokeDasharray="3,3" />
                    <line x1="20" y1="130" x2="260" y2="130" stroke="var(--border)" />

                    {/* Main Curve */}
                    <path d={potentialPath} fill="none" stroke="var(--primary)" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />

                    {/* Active marker dot */}
                    <circle cx={currentX} cy={currentY} r="5" fill="var(--primary)" stroke="white" strokeWidth="1.5" />

                    {/* X Axis Labels */}
                    <text x="20" y="145" fill="var(--muted-foreground)" fontSize="9">{startAge}</text>
                    <text x="80" y="145" fill="var(--muted-foreground)" fontSize="9">{Math.round(startAge + (endAge - startAge) * 0.25)}</text>
                    <text x="140" y="145" fill="var(--muted-foreground)" fontSize="9">{Math.round(startAge + (endAge - startAge) * 0.5)}</text>
                    <text x="200" y="145" fill="var(--muted-foreground)" fontSize="9">{Math.round(startAge + (endAge - startAge) * 0.75)}</text>
                    <text x="260" y="145" fill="var(--muted-foreground)" fontSize="9" textAnchor="end">{endAge}</text>
                  </svg>
                </div>
              </div>
            </aside>

            {/* COLUMN 2: CENTER AREA (Attribute Tabs, Percentiles List / Radar Web) */}
            <main className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
              {/* Header overall actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-md border border-border/40 p-5 rounded-2xl">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Analytics Rating</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-primary">{player.overall || 75}</span>
                    <span className="text-sm font-semibold text-muted-foreground">OVR</span>
                    <span className="text-2xl font-bold tracking-tight text-accent ml-4">{player.potential || 80}</span>
                    <span className="text-sm font-semibold text-muted-foreground">POT</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
                    <Button
                      className="relative flex-1 sm:flex-none h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg px-10 rounded-xl flex items-center justify-center gap-3 border-0 shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => router.push(`/analytics/similar?id=${player.fifa_id || player.id}`)}
                    >
                      Find Similar Players
                      <span className="text-[10px] bg-black/45 text-emerald-200 px-2.5 py-1 rounded-full font-extrabold tracking-wider uppercase">
                        ML Engine
                      </span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Selection Classification Tabs */}
              <div className="flex border-b border-border">
                {((player.position?.split(",")[0].trim().toUpperCase() === "GK"
                  ? ["Physical", "Goalkeeping", "Defensive & Mental"]
                  : ["Physical", "Attacking", "Defensive & Mental"]) as MainTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-none py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === tab
                          ? "border-primary text-primary font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
              </div>

              {/* Sub-tabs [Percentiles] [Radar] */}
              <div className="flex justify-between items-center bg-card/50 p-2 rounded-xl border border-border/60">
                <div className="flex gap-2">
                  {(["Percentiles", "Radar"] as SubTab[]).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubTab(sub)}
                      className={`py-1.5 px-4 text-xs font-bold rounded-lg cursor-pointer transition-all ${activeSubTab === sub
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-card"
                        }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground pr-2 font-medium">
                  Category: {activeTab}
                </span>
              </div>

              {/* Active Tab Panel Content */}
              <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-md">
                {activeSubTab === "Percentiles" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    {attributeCategories[activeTab].map(attrKey => {
                      const ratingValue = player[attrKey] || 50;
                      return (
                        <div key={attrKey} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-muted-foreground">{getAttributeLabel(attrKey)}</span>
                            <span className="font-semibold">{ratingValue}</span>
                          </div>

                          {/* Interactive Progress bar with point dot */}
                          <div className="relative w-full h-2.5 bg-secondary/85 rounded-full overflow-visible">
                            <div
                              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${ratingValue}%` }}
                            >
                              {/* Dot marker */}
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-md"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Radar Web tab */
                  <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="relative bg-background rounded-full p-4 border border-border shadow-inner">
                      <svg width="300" height="300" className="overflow-visible">
                        {/* Web guidelines */}
                        {radarData.webPaths.map((pts, i) => (
                          <polygon key={i} points={pts} fill="none" stroke="var(--border)" strokeWidth="0.8" />
                        ))}

                        {/* Axis Spoke lines */}
                        {radarData.labels.map((p, i) => (
                          <line key={i} x1="150" y1="150" x2={150 + 90 * Math.cos(p.angle)} y2={150 + 90 * Math.sin(p.angle)} stroke="var(--border)" strokeWidth="0.8" />
                        ))}

                        {/* Solid Rating shape overlay */}
                        <polygon
                          points={radarData.polygonPath}
                          fill="rgba(59,130,246,0.15)"
                          stroke="var(--primary)"
                          strokeWidth="2.5"
                          className="drop-shadow-[0_0_6px_rgba(59,130,246,0.25)]"
                        />

                        {/* Point dots */}
                        {radarData.labels.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--primary)" stroke="white" strokeWidth="1" />
                        ))}

                        {/* Outer text Labels */}
                        {radarData.labels.map((p, i) => {
                          const labelDist = 110;
                          const lx = 150 + labelDist * Math.cos(p.angle);
                          const ly = 150 + labelDist * Math.sin(p.angle);
                          const anchor = Math.cos(p.angle) > 0.1 ? "start" : Math.cos(p.angle) < -0.1 ? "end" : "middle";
                          return (
                            <g key={i}>
                              <text x={lx} y={ly} fill="var(--foreground)" fontSize="11" fontWeight="bold" textAnchor={anchor}>{p.name}</text>
                              <text x={lx} y={ly + 12} fill="var(--primary)" fontSize="9" fontWeight="bold" textAnchor={anchor}>{p.value}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                      This radar diagram visualizes the overall athletic and skill balance across the 6 major performance indices.
                    </p>
                  </div>
                )}
              </Card>
            </main>

            {/* COLUMN 3: RIGHT SIDEBAR (Field position map & heat maps) */}
            <aside className="w-full xl:w-80 border-l border-border/40 bg-card/75 backdrop-blur-md overflow-y-auto flex flex-col p-6 space-y-6">

              {/* Modeled Player Shot Map */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Player Shot Map</h3>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Model
                  </span>
                </div>
                
                {player.position?.split(",")[0].trim().toUpperCase() === "GK" ? (
                  <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-2xl p-6 text-center text-xs text-muted-foreground">
                    Goalkeepers do not have offensive shot maps.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
                      <svg width="220" height="200" className="bg-emerald-950/30 rounded-xl border border-emerald-900/60 relative overflow-hidden">
                        {/* Midfield line at bottom (y = 190) */}
                        <line x1="15" y1="190" x2="205" y2="190" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
                        
                        {/* Outer boundary */}
                        <rect x="15" y="10" width="190" height="180" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />
                        
                        {/* Penalty Box */}
                        <rect x="58" y="10" width="104" height="54" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />
                        
                        {/* Six yard Box */}
                        <rect x="86" y="10" width="48" height="18" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />

                        {/* Goal post */}
                        <line x1="100" y1="10" x2="120" y2="10" stroke="white" strokeWidth="2.5" />

                        {/* Render shots */}
                        {shots.map((s: any, idx: number) => {
                          const svgX = 15 + (s.y / 80) * 190;
                          const svgY = 190 - ((s.x - 60) / 60) * 180;
                          const r = 3.5 + s.xg * 8;

                          return (
                            <circle
                              key={idx}
                              cx={svgX}
                              cy={svgY}
                              r={r}
                              fill={s.goal ? "rgba(16,185,129,0.85)" : "rgba(148,163,184,0.3)"}
                              stroke={s.goal ? "#10b981" : "#94a3b8"}
                              strokeWidth={s.goal ? 1.5 : 1}
                              className="transition-all hover:scale-125 cursor-help"
                            >
                              <title>{`xG: ${s.xg} | ${s.goal ? "GOAL" : "Miss"}`}</title>
                            </circle>
                          );
                        })}
                      </svg>

                      {/* Legend */}
                      <div className="w-full flex justify-between items-center text-[9px] text-muted-foreground mt-3 px-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          Goal
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-500/40 inline-block"></span>
                          Miss
                        </span>
                        <span>Size = xG</span>
                      </div>
                    </div>

                    {/* Stats Summary Panel */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-background border border-border rounded-xl p-2">
                        <span className="block text-lg font-bold text-foreground">{shots.length}</span>
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Modeled Shots</span>
                      </div>
                      <div className="bg-background border border-border rounded-xl p-2">
                        <span className="block text-lg font-bold text-primary">{totalXg.toFixed(1)}</span>
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Total xG</span>
                      </div>
                      <div className="bg-background border border-border rounded-xl p-2">
                        <span className="block text-lg font-bold text-emerald-500">{goalsCount}</span>
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Goals</span>
                      </div>
                      <div className="bg-background border border-border rounded-xl p-2">
                        <span className="block text-lg font-bold text-accent">{conversionRate}%</span>
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">Conversion</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-border" />

              {/* Tactical Heat Map */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tactical Heat Map</h3>
                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Pace-Scaled
                  </span>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-4 flex justify-center relative overflow-hidden">
                  <svg width="220" height="300" className="bg-emerald-950/30 rounded-xl border border-emerald-900/60 relative overflow-hidden">
                    <defs>
                      <filter id="heatBlur">
                        <feGaussianBlur stdDeviation="8" />
                      </filter>
                    </defs>

                    {/* Field Markings */}
                    <rect x="15" y="15" width="190" height="270" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />
                    <line x1="15" y1="150" x2="205" y2="150" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />
                    <circle cx="110" cy="150" r="30" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />

                    <rect x="58" y="15" width="104" height="45" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />
                    <rect x="86" y="15" width="48" height="15" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />

                    <rect x="58" y="240" width="104" height="45" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />
                    <rect x="86" y="270" width="48" height="15" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />

                    {/* Heat density overlay */}
                    <g filter="url(#heatBlur)">
                      {heatmapPoints.map((pt: any, idx: number) => (
                        <g key={idx}>
                          <circle cx={pt.x} cy={pt.y} r={pt.r + 5} fill="var(--accent)" opacity="0.05" />
                          <circle cx={pt.x} cy={pt.y} r={pt.r} fill="var(--primary)" opacity="0.10" />
                          <circle cx={pt.x} cy={pt.y} r={Math.max(3, pt.r - 6)} fill="orange" opacity="0.18" />
                        </g>
                      ))}
                    </g>
                  </svg>
                </div>
              </div>

              <hr className="border-border" />

              {/* Tactical text info */}
              <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/80">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scout Analysis Summary</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {player.name} plays primarily as a <span className="font-semibold text-primary">{player.position?.split(",")[0] || "player"}</span>.
                  Showing an overall quality of <span className="font-semibold">{player.overall}</span> and outstanding progression up to <span className="font-semibold text-accent">{player.potential}</span>.
                  Highly recommended for targets requiring strong <span className="font-medium">{player.preferred_foot || "Right"}-footed</span> tactical execution.
                </p>
              </div>

            </aside>
          </div>
        ) : (
          /* Search Profile Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background max-w-sm mx-auto text-center space-y-6">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <Search size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Search a player profile</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select or search any player to display their analytics and performance details.
              </p>
            </div>
            <div className="w-full max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search player name..."
                value={statsQuery}
                onChange={handleStatsSearchChange}
                onFocus={() => statsQuery.trim().length >= 2 && setShowStatsDropdown(true)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {statsLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground h-4 w-4" />
              )}
              {showStatsDropdown && statsResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto z-50 text-left">
                  {statsResults.map((p) => (
                    <div
                      key={p.fifa_id || p.id}
                      onClick={() => {
                        router.push(`/analytics?id=${p.fifa_id || p.id}`);
                        setShowStatsDropdown(false);
                        setStatsQuery("");
                      }}
                      className="flex items-center justify-between p-2.5 hover:bg-accent cursor-pointer text-xs"
                    >
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.club} • {p.position}</p>
                      </div>
                      <span className="font-bold text-primary">OVR {p.overall}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* Comparison View Dashboard */
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Player 1 Card (Compare Target) */}
            <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-visible min-h-[220px]">
              {compareSource ? (
                <div className="w-full flex flex-col items-center space-y-4">
                  <button
                    onClick={() => setCompareSource(null)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                  <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-md">
                    <img
                      src={compareSource.face_url || DEFAULT_AVATAR}
                      alt={compareSource.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{compareSource.name}</h3>
                    <p className="text-sm text-primary font-semibold">{compareSource.position?.split(",")[0]} • {compareSource.club}</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center"><span className="text-2xl font-black text-primary">{compareSource.overall}</span><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">OVR</p></div>
                    <div className="text-center"><span className="text-2xl font-black text-accent">{compareSource.potential}</span><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">POT</p></div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 font-semibold border-primary/30 hover:border-primary transition-colors cursor-pointer"
                    onClick={() => {
                      router.push(`/analytics?id=${compareSource.fifa_id || compareSource.id}`);
                      setMode("stats");
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-xs space-y-4 relative">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-secondary rounded-full">
                      <Search size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold">Select Target Player</h3>
                    <p className="text-xs text-muted-foreground text-center">Search and pick target player to compare</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search player name..."
                      value={sourceQuery}
                      onChange={handleSourceSearchChange}
                      onFocus={() => sourceQuery.trim().length >= 2 && setShowSourceDropdown(true)}
                      className="w-full pl-9 pr-8 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    {sourceLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground h-4 w-4" />
                    )}
                    {showSourceDropdown && sourceResults.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto z-50 text-left">
                        {sourceResults.map((p) => (
                          <div
                            key={p.fifa_id || p.id}
                            onClick={() => handleSelectSourcePlayer(p.fifa_id || p.id)}
                            className="flex items-center justify-between p-2.5 hover:bg-accent cursor-pointer text-xs"
                          >
                            <div>
                              <p className="font-semibold">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.club} • {p.position}</p>
                            </div>
                            <span className="font-bold text-primary">OVR {p.overall}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Middle: Comparison Radar Chart */}
            <Card className="p-6 border-border/40 bg-card/65 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Radar Overlay Comparison</h3>
              {compareSource && comparePlayer ? (
                <div className="relative flex flex-col items-center">
                  <svg width="260" height="260" className="overflow-visible">
                    {/* Web guidelines */}
                    {(() => {
                      const cx = 130;
                      const cy = 130;
                      const r = 80;
                      const metrics = ["Pace", "Shooting", "Passing", "Dribbling", "Defending", "Physical"];
                      const keys = ["pace", "shooting", "passing", "dribbling", "defending", "physical"];
                      const points = metrics.map((_, idx) => {
                        const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle };
                      });

                      const webPaths = Array.from({ length: 4 }).map((_, step) => {
                        const factor = (step + 1) / 4;
                        return points.map((p) => {
                          const x = cx + r * factor * Math.cos(p.angle);
                          const y = cy + r * factor * Math.sin(p.angle);
                          return `${x},${y}`;
                        }).join(" ");
                      });

                      const p1Pts = keys.map((key, idx) => {
                        const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                        const val = compareSource[key] || 50;
                        return `${cx + r * (val / 100) * Math.cos(angle)},${cy + r * (val / 100) * Math.sin(angle)}`;
                      }).join(" ");

                      const p2Pts = keys.map((key, idx) => {
                        const angle = (idx * 2 * Math.PI) / 6 - Math.PI / 2;
                        const val = comparePlayer[key] || 50;
                        return `${cx + r * (val / 100) * Math.cos(angle)},${cy + r * (val / 100) * Math.sin(angle)}`;
                      }).join(" ");

                      return (
                        <g>
                          {webPaths.map((pts, idx) => (
                            <polygon key={idx} points={pts} fill="none" stroke="var(--border)" strokeWidth="0.8" />
                          ))}
                          {points.map((p, idx) => (
                            <line key={idx} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="0.8" />
                          ))}
                          {/* Player 1 shape (Sky Blue) */}
                          <polygon points={p1Pts} fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" strokeWidth="2.5" />
                          {/* Player 2 shape (Orange) */}
                          <polygon points={p2Pts} fill="rgba(249,115,22,0.12)" stroke="#f97316" strokeWidth="2.5" />

                          {/* Outer text Labels */}
                          {points.map((p, idx) => {
                            const lx = cx + 96 * Math.cos(p.angle);
                            const ly = cx + 96 * Math.sin(p.angle);
                            const anchor = Math.cos(p.angle) > 0.1 ? "start" : Math.cos(p.angle) < -0.1 ? "end" : "middle";
                            return (
                              <text key={idx} x={lx} y={ly + 4} fill="var(--muted-foreground)" fontSize="9" fontWeight="bold" textAnchor={anchor}>
                                {metrics[idx]}
                              </text>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="flex justify-center gap-4 text-[10px] mt-2">
                    <span className="flex items-center gap-1.5 font-bold text-sky-400"><span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span>{compareSource.name}</span>
                    <span className="flex items-center gap-1.5 font-bold text-orange-400"><span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>{comparePlayer.name}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-sm text-muted-foreground">
                  Select both players to display the comparison radar.
                </div>
              )}
            </Card>

            {/* Player 2 Card (Comparison Player) */}
            <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-visible min-h-[220px]">
              {comparePlayer ? (
                <div className="w-full flex flex-col items-center space-y-4">
                  <button
                    onClick={() => setComparePlayer(null)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                  <Avatar className="h-28 w-28 border-4 border-indigo-500/20 shadow-md">
                    <img
                      src={comparePlayer.face_url || DEFAULT_AVATAR}
                      alt={comparePlayer.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{comparePlayer.name}</h3>
                    <p className="text-sm text-indigo-400 font-semibold">{comparePlayer.position?.split(",")[0]} • {comparePlayer.club}</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center"><span className="text-2xl font-black text-indigo-400">{comparePlayer.overall}</span><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">OVR</p></div>
                    <div className="text-center"><span className="text-2xl font-black text-accent">{comparePlayer.potential}</span><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">POT</p></div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 font-semibold border-indigo-500/30 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={() => {
                      router.push(`/analytics?id=${comparePlayer.fifa_id || comparePlayer.id}`);
                      setMode("stats");
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-xs space-y-4 relative">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-secondary rounded-full">
                      <Search size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold">Select Comparison Target</h3>
                    <p className="text-xs text-muted-foreground text-center">Search and pick any player to overlay ratings</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      value={compareQuery}
                      onChange={handleCompareSearchChange}
                      onFocus={() => compareQuery.trim().length >= 2 && setShowCompareDropdown(true)}
                      placeholder="Search player..."
                      className="w-full pl-9 pr-8 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    {compareLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground h-4 w-4" />
                    )}
                    {showCompareDropdown && compareResults.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto z-50 text-left">
                        {compareResults.map((p) => (
                          <div
                            key={p.fifa_id || p.id}
                            onClick={() => handleSelectComparePlayer(p.fifa_id || p.id)}
                            className="flex items-center justify-between p-2.5 hover:bg-accent cursor-pointer text-xs"
                          >
                            <div>
                              <p className="font-semibold">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.club} • {p.position}</p>
                            </div>
                            <span className="font-bold text-primary">OVR {p.overall}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Details attribute comparison matrix table */}
          {compareSource && comparePlayer && (
            <Card className="border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Detailed Attributes Matrix</h3>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Green indicates superior stat</span>
              </div>
              <div className="divide-y divide-border">
                {Object.entries(attributeCategories)
                  .filter(([category]) => {
                    const isSourceGk = compareSource.position?.split(",")[0].trim().toUpperCase() === "GK";
                    if (isSourceGk) {
                      // GKs: keep Goalkeeping, remove Attacking
                      return category !== "Attacking";
                    } else {
                      // Field players: keep Attacking, remove Goalkeeping
                      return category !== "Goalkeeping";
                    }
                  })
                  .map(([category, attributes]) => (
                    <div key={category} className="p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        {attributes.map((attrKey) => {
                          const v1 = compareSource[attrKey] || 0;
                          const v2 = comparePlayer[attrKey] || 0;
                          return (
                            <div key={attrKey} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground w-1/3 truncate">{getAttributeLabel(attrKey)}</span>
                              <div className="flex items-center justify-end gap-6 flex-1">
                                <span className={`font-semibold w-8 text-right ${v1 > v2 ? "text-emerald-500 font-extrabold" : v1 < v2 ? "text-muted-foreground" : ""}`}>{v1}</span>
                                <div className="flex flex-col gap-1 w-24">
                                  {/* Target Player 1 (Sky Blue) */}
                                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500" style={{ width: `${v1}%` }}></div>
                                  </div>
                                  {/* Compare Player 2 (Orange) */}
                                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: `${v2}%` }}></div>
                                  </div>
                                </div>
                                <span className={`font-semibold w-8 text-left ${v2 > v1 ? "text-emerald-500 font-extrabold" : v2 < v1 ? "text-muted-foreground" : ""}`}>{v2}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}
      </div>
    </div>
  );
}