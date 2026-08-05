"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bookmark, 
  Trash, 
  Save, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  Loader2, 
  Search,
  ArrowUpRight,
  SlidersHorizontal
} from "lucide-react";
import { ScoutProvider, useScout } from "@/components/scout/ScoutContext";
import FilterSidebar from "@/components/scout/FilterSidebar";

interface WatchlistItem {
  id: number;
  user_id: number;
  player_id: number;
  player_name: string;
  club: string;
  nationality: string;
  overall: number;
  potential: number;
  market_value: number;
  notes: string | null;
  created_at: string;
}

interface HiddenGem {
  fifa_id: number;
  name: string;
  age: number;
  overall: number;
  potential: number;
  value_eur: number | null;
  wage_eur: number | null;
  predicted_value_eur: number;
  undervaluation_gap: number;
  hidden_gem_score: number;
}

export default function WatchlistPage() {
  return (
    <ScoutProvider>
      <WatchlistContent />
    </ScoutProvider>
  );
}

function WatchlistContent() {
  const {
    search,
    setSearch,
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
    setShowFilters,
  } = useScout();

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"scouted" | "ai_gems">("scouted");
  
  // Watchlist manual states
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [watchlistDetails, setWatchlistDetails] = useState<Record<number, any>>({});
  const [itemsLoading, setItemsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<number, boolean>>({});

  // AI Hidden Gems states
  const [gems, setGems] = useState<HiddenGem[]>([]);
  const [gemsLoading, setGemsLoading] = useState(true);
  const [gemDetails, setGemDetails] = useState<Record<number, any>>({});

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [sortBy, setSortBy] = useState<"gem_score" | "undervaluation" | "predicted_value" | "overall" | "potential" | "age">("gem_score");

  // Fetch watchlist items
  const fetchWatchlist = async () => {
    if (!user) return;
    setItemsLoading(true);
    try {
      const res = await api.get(`/watchlist/${user.id}`);
      setWatchlistItems(res.data || []);
      
      // Initialize notes editing state
      const initialNotes: Record<number, string> = {};
      res.data.forEach((item: WatchlistItem) => {
        initialNotes[item.player_id] = item.notes || "";
      });
      setEditingNotes(initialNotes);
    } catch (err) {
      console.error("Error loading watchlist:", err);
      toast.error("Failed to load watchlist.");
    } finally {
      setItemsLoading(false);
    }
  };

  // Fetch AI Hidden Gems
  const fetchHiddenGems = async () => {
    setGemsLoading(true);
    try {
      const res = await api.get("/ai/hidden-gems", {
        params: {
          limit: 120,
          search: search || undefined,
          league: league || undefined,
          nationality: nationality || undefined,
          position: position || undefined,
          min_overall: minOverall > 50 ? minOverall : undefined,
          min_age: minAge > 15 ? minAge : undefined,
          max_age: maxAge < 40 ? maxAge : undefined,
          min_potential: minPotential > 50 ? minPotential : undefined,
          min_height: minHeight > 150 ? minHeight : undefined,
          min_weight: minWeight > 50 ? minWeight : undefined,
          max_market_value: maxMarketValue < 250000000 ? maxMarketValue : undefined,
          min_xg: minXg > 0 ? minXg : undefined,
          min_goals: minGoals > 0 ? minGoals : undefined,
          min_pass_accuracy: minPassAccuracy > 50 ? minPassAccuracy : undefined,
          min_progressive_passes: minProgressivePasses > 0 ? minProgressivePasses : undefined,
          foot: foot || undefined,
        }
      });
      setGems(res.data || []);
    } catch (err) {
      console.error("Error loading hidden gems:", err);
      toast.error("Failed to load AI hidden gems.");
    } finally {
      setGemsLoading(false);
    }
  };

  // Load player profile details (avatar, position etc.) for watchlisted items
  useEffect(() => {
    const fetchPlayerDetails = async () => {
      const details: Record<number, any> = { ...watchlistDetails };
      const missingIds = watchlistItems
        .map(item => item.player_id)
        .filter(id => !details[id]);

      if (missingIds.length === 0) return;

      // Fetch details in parallel chunks
      try {
        await Promise.all(
          missingIds.map(async (id) => {
            const res = await api.get(`/players/${id}`);
            details[id] = res.data;
          })
        );
        setWatchlistDetails(details);
      } catch (err) {
        console.error("Error loading watchlist player profiles:", err);
      }
    };

    if (watchlistItems.length > 0) {
      fetchPlayerDetails();
    }
  }, [watchlistItems]);

  useEffect(() => {
    const fetchGemDetails = async () => {
      const details = { ...gemDetails };
      const missingIds = gems
        .map(g => g.fifa_id)
        .filter(id => !details[id]);

      if (missingIds.length === 0) return;

      try {
        await Promise.all(
          missingIds.map(async (id) => {
            const res = await api.get(`/players/${id}`);
            details[id] = res.data;
          })
        );
        setGemDetails(details);
      } catch (err) {
        console.error("Error loading gem details:", err);
      }
    };

    if (gems.length > 0) {
      fetchGemDetails();
    }
  }, [gems]);

  // Fetch watchlist when user changes
  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  // Fetch hidden gems when user, activeTab, or filters change
  useEffect(() => {
    if (user && activeTab === "ai_gems") {
      fetchHiddenGems();
    }
  }, [
    user,
    activeTab,
    search,
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
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
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
  ]);

  // Remove player from watchlist
  const handleRemove = async (playerId: number, name: string) => {
    if (!user) return;
    try {
      await api.delete(`/watchlist/${playerId}`, { params: { user_id: user.id } });
      setWatchlistItems(prev => prev.filter(item => item.player_id !== playerId));
      toast.success(`${name} removed from watchlist.`);
    } catch (err) {
      console.error("Error removing player:", err);
      toast.error("Failed to remove player from watchlist.");
    }
  };

  // Save notes handler
  const handleSaveNotes = async (playerId: number) => {
    if (!user) return;
    setSavingNotes(prev => ({ ...prev, [playerId]: true }));
    try {
      const notesText = editingNotes[playerId] || "";
      await api.patch(`/watchlist/${playerId}/notes`, { notes: notesText }, { params: { user_id: user.id } });
      toast.success("Notes saved successfully.");
      
      // Update local item notes value
      setWatchlistItems(prev => prev.map(item => 
        item.player_id === playerId ? { ...item, notes: notesText } : item
      ));
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Failed to update notes.");
    } finally {
      setSavingNotes(prev => ({ ...prev, [playerId]: false }));
    }
  };

  // Quick add Hidden Gem to watchlist
  const handleAddGem = async (gem: HiddenGem) => {
    if (!user) {
      toast.error("Please login to bookmark players.");
      return;
    }
    try {
      await api.post("/watchlist/", {
        user_id: user.id,
        player_id: gem.fifa_id,
        notes: "Identified by AI engine as an undervalued Hidden Gem."
      });
      toast.success(`${gem.name} added to watchlist!`);
      
      // Refresh watchlist items
      fetchWatchlist();
    } catch (err) {
      console.error("Error adding hidden gem:", err);
      toast.error("Failed to add player to watchlist.");
    }
  };

  // Format currencies
  const formatMoney = (val: number | null) => {
    if (!val) return "N/A";
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  const getDotColor = (position: string) => {
    const pos = (position || "").split(",")[0].trim().toUpperCase();
    if (pos === "GK") return "bg-amber-500";
    if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) return "bg-blue-500";
    if (["CM", "CDM", "CAM", "LM", "RM"].includes(pos)) return "bg-emerald-500";
    return "bg-rose-500";
  };

  // Sort and pagination math for AI Undervalued Gems
  const sortedGems = [...gems].sort((a, b) => {
    if (sortBy === "gem_score") return b.hidden_gem_score - a.hidden_gem_score;
    if (sortBy === "undervaluation") return b.undervaluation_gap - a.undervaluation_gap;
    if (sortBy === "predicted_value") return b.predicted_value_eur - a.predicted_value_eur;
    if (sortBy === "overall") return b.overall - a.overall;
    if (sortBy === "potential") return b.potential - a.potential;
    if (sortBy === "age") return a.age - b.age;
    return 0;
  });

  const totalGems = sortedGems.length;
  const totalPages = Math.ceil(totalGems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedGems = sortedGems.slice(startIndex, startIndex + pageSize);

  if (authLoading || (user && itemsLoading && watchlistItems.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h2 className="text-xl font-bold">Watchlist Hub</h2>
        <p className="text-muted-foreground text-sm max-w-sm">Please log in to manage your favorites watchlist and view AI undervaluation models.</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen background image behind sidebar and header */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: "url('/images/watchlist/watch-1.jpg')" }}
      />
      {/* Dark overlay for contrast and readability */}
      <div className="fixed inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none z-0" />

      <div className="flex h-full w-full overflow-hidden relative z-10 bg-transparent">
        <div className="flex flex-1 relative z-10 h-full w-full overflow-hidden">
      <div className="flex-grow flex flex-col p-6 space-y-6 overflow-y-auto">
        
        {/* Page Title */}
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Watchlist Hub</h1>
          <p className="text-xs text-muted-foreground">
            Manage your scouted favorites watchlist and review ML AI hidden gems predictions.
          </p>
        </div>

        {/* Tabs Menu Header */}
        <div className="border-b border-border/40 flex w-full h-12 bg-card/75 backdrop-blur-md rounded-t-xl overflow-hidden shrink-0">
          <button
            onClick={() => setActiveTab("scouted")}
            className={`flex-1 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "scouted"
                ? "border-primary text-primary bg-primary/5 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/5"
            }`}
          >
            <Bookmark size={14} className={activeTab === "scouted" ? "fill-primary" : ""} />
            Scouted Favorites ({watchlistItems.length})
          </button>
          <button
            onClick={() => setActiveTab("ai_gems")}
            className={`flex-1 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "ai_gems"
                ? "border-primary text-primary bg-primary/5 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/5"
            }`}
          >
            <Sparkles size={14} className={activeTab === "ai_gems" ? "text-primary animate-pulse" : ""} />
            AI Undervalued Gems ({gems.length})
          </button>
        </div>

        {/* Scouted Watchlist Tab content */}
        {activeTab === "scouted" && (
          <div className="flex-grow flex flex-col">
            {watchlistItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card/60 backdrop-blur-md rounded-b-xl border border-border/40 border-t-0 text-center space-y-4">
                <div className="p-4 bg-muted/40 rounded-full text-muted-foreground">
                  <Bookmark size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Watchlist is Empty</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Go search players in the Scouting Dashboard and bookmark them to populate your board.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push("/scout")} 
                  size="sm"
                  className="font-bold flex items-center gap-2"
                >
                  <Search size={14} />
                  Scout Players
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card/50 backdrop-blur-md border border-border/40 border-t-0 p-6 rounded-b-xl">
                {watchlistItems.map((item) => {
                  const details = watchlistDetails[item.player_id];
                  const pos = details?.position ? details.position.split(",")[0].trim() : "Unknown";

                  return (
                    <Card key={item.id} className="p-5 border border-border/40 bg-card/65 backdrop-blur-xs flex flex-col justify-between space-y-4 relative hover:border-primary/50 hover:bg-card/85 transition-all duration-300">
                      
                      {/* Top Row: Basic Info and Remove */}
                      <div className="flex items-start justify-between">
                        <div 
                          onClick={() => router.push(`/analytics?id=${item.player_id}`)}
                          className="flex gap-3.5 items-center cursor-pointer group"
                        >
                          <div className="relative">
                            <img
                              src={details?.face_url || DEFAULT_AVATAR}
                              alt={item.player_name}
                              className="w-12 h-12 rounded-full border border-border object-cover bg-muted group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_AVATAR;
                              }}
                            />
                            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${getDotColor(pos)}`}></span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {item.player_name}
                              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              {pos} • {item.club} • {item.nationality}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemove(item.player_id, item.player_name)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                          title="Remove from Watchlist"
                        >
                          <Trash size={15} />
                        </button>
                      </div>

                      {/* Ratings and Value grid */}
                      <div className="grid grid-cols-3 gap-3 text-center bg-muted/20 p-2.5 rounded-lg text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">OVR</span>
                          <span className="text-primary font-black">{item.overall}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">POT</span>
                          <span className="text-accent font-black">{item.potential}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">VAL</span>
                          <span className="text-foreground font-black">{formatMoney(item.market_value)}</span>
                        </div>
                      </div>

                      {/* Scouting Notes Box */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <FileText size={12} />
                          Scout Notes
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            placeholder="Write player reports, notes, observations..."
                            value={editingNotes[item.player_id] || ""}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [item.player_id]: e.target.value })}
                            className="flex-grow min-h-[50px] max-h-[120px] p-2 bg-background border border-border text-xs rounded-lg outline-none focus:ring-1 focus:ring-primary text-foreground"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleSaveNotes(item.player_id)}
                            disabled={savingNotes[item.player_id] || editingNotes[item.player_id] === item.notes}
                            className="h-10 w-10 flex items-center justify-center shrink-0 border-border hover:bg-muted"
                            title="Save notes"
                          >
                            {savingNotes[item.player_id] ? (
                              <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
                            ) : (
                              <Save className="h-4.5 w-4.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AI Hidden Gems Tab Content */}
        {activeTab === "ai_gems" && (
          <div className="flex flex-col bg-card/50 backdrop-blur-md border border-border/40 border-t-0 rounded-b-xl">
            {gemsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground mt-2 font-semibold">Running ML valuations regression models...</span>
              </div>
            ) : gems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                <Sparkles size={36} className="text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">AI valuations data unavailable currently.</p>
              </div>
            ) : (
              <>
                {/* Controls Ribbon */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/10 border-b border-border p-4">
                  
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search name, club, nation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>

                    {/* Sort dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sort By</span>
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value as any);
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 rounded-lg bg-background border border-border text-xs font-semibold outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                      >
                        <option value="gem_score">AI Gem Score</option>
                        <option value="undervaluation">Undervaluation Gap</option>
                        <option value="predicted_value">AI Predicted Value</option>
                        <option value="overall">Overall Rating</option>
                        <option value="potential">Potential</option>
                        <option value="age">Age (Youngest)</option>
                      </select>
                    </div>

                    {/* Filters Toggle Button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        showFilters
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground hover:bg-accent border-border"
                      }`}
                    >
                      <SlidersHorizontal size={14} />
                      <span>Filters</span>
                    </button>
                  </div>

                  {/* Model Accuracy Statistics (Scout Dashboard Style) */}
                  <div className="flex flex-wrap items-center gap-3.5 text-[10px] text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/40 font-semibold w-full md:w-auto md:justify-end">
                    <div>
                      Model: <span className="font-extrabold text-foreground">Random Forest</span>
                    </div>
                    <span className="text-border/60">|</span>
                    <div>
                      R² Accuracy: <span className="font-black text-emerald-500">94.28%</span>
                    </div>
                    <span className="text-border/60">|</span>
                    <div>
                      Avg Error (MAE): <span className="font-extrabold text-foreground">€518K</span>
                    </div>
                    <span className="text-border/60">|</span>
                    <div>
                      Dataset: <span className="font-extrabold text-foreground">180,158</span>
                    </div>
                  </div>

                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                  {paginatedGems.map((gem) => {
                    const isBookmarked = watchlistItems.some(item => item.player_id === gem.fifa_id);
                    const details = gemDetails[gem.fifa_id];
                    const pos = details?.position ? details.position.split(",")[0].trim() : "Unknown";
                    
                    return (
                      <Card key={gem.fifa_id} className="p-3.5 border border-border/40 bg-card/65 backdrop-blur-xs flex flex-col justify-between space-y-3 hover:border-primary/50 hover:bg-card/85 transition-all duration-300 relative shadow-sm">
                        
                        {/* Header (Similar to Scout page card - Compact) */}
                        <div className="flex justify-between items-start">
                          <div 
                            onClick={() => router.push(`/analytics?id=${gem.fifa_id}`)}
                            className="flex gap-2.5 items-center cursor-pointer group min-w-0"
                          >
                            <div className="relative shrink-0">
                              <img 
                                src={details?.face_url || DEFAULT_AVATAR} 
                                alt={gem.name} 
                                className="w-9 h-9 rounded-full border border-border object-cover bg-muted group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_AVATAR;
                                }}
                              />
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${getDotColor(pos)}`}></span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1 truncate">
                                {gem.name}
                                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </h4>
                              <p className="text-[9px] text-muted-foreground font-semibold mt-0.5 truncate">
                                {pos} • {details?.club || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
                            {/* Rating Circle - Compact */}
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px]">
                              {gem.overall}
                            </div>
                            <button
                              disabled={isBookmarked}
                              onClick={() => handleAddGem(gem)}
                              className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title={isBookmarked ? "Watchlisted" : "Quick bookmark"}
                            >
                              <Bookmark size={11} className={isBookmarked ? "fill-primary text-primary" : ""} />
                            </button>
                          </div>
                        </div>

                        <hr className="border-border/60" />

                        {/* Info grid - Compact */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[10px]">
                          <div>
                            <p className="text-[9px] text-muted-foreground font-semibold">Age</p>
                            <p className="font-bold text-foreground">{gem.age} yrs</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-muted-foreground font-semibold">Potential</p>
                            <p className="font-bold text-accent">{gem.potential}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-muted-foreground font-semibold">Real Value</p>
                            <p className="font-bold text-foreground">{formatMoney(gem.value_eur)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-muted-foreground font-semibold flex items-center gap-0.5">
                              <TrendingUp size={8} className="text-emerald-500" />
                              AI Fair Value
                            </p>
                            <p className="font-bold text-primary">{formatMoney(gem.predicted_value_eur)}</p>
                          </div>
                        </div>

                        <hr className="border-border/40" />

                        {/* Valuation Gap & Gem Score - Compact */}
                        <div className="flex justify-between items-center text-[9px] gap-1">
                          <span className="font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider truncate">
                            +{formatMoney(gem.undervaluation_gap)}
                          </span>
                          <span className="font-black text-accent shrink-0">
                            {gem.hidden_gem_score.toFixed(0)}% AI Match
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-border bg-muted/10">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalGems)} of {totalGems} undervalued gems
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="text-xs font-bold px-3 border-border hover:bg-muted cursor-pointer"
                      >
                        Previous
                      </Button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        if (totalPages > 6 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return <span key={pageNum} className="text-muted-foreground text-xs px-1">...</span>;
                          }
                          return null;
                        }

                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`text-xs font-bold h-8 w-8 p-0 cursor-pointer ${
                              currentPage === pageNum ? "" : "border-border hover:bg-muted"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="text-xs font-bold px-3 border-border hover:bg-muted cursor-pointer"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
      {activeTab === "ai_gems" && <FilterSidebar />}
      </div>
      </div>
    </>
  );
}
