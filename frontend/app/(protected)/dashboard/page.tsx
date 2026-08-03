"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { calculateAdvancedChemistry } from "@/lib/chemistry";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Users, 
  Eye, 
  Bot, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Loader2, 
  ChevronRight,
  ChevronLeft,
  Gauge,
  Newspaper
} from "lucide-react";
import DashboardBackground from "@/components/dashboard/DashboardBackground";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Dashboard stats state
  const [squad, setSquad] = useState<any>(null);
  const [squadProfiles, setSquadProfiles] = useState<any[]>([]);
  const [watchlistCount, setWatchlistCount] = useState<number>(0);
  const [watchlistPlayers, setWatchlistPlayers] = useState<any[]>([]);
  const [gems, setGems] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [activeNewsIdx, setActiveNewsIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [managerName, setManagerName] = useState("");

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setActiveNewsIdx((prev) => (prev + 1) % Math.min(news.length, 6));
    }, 6000);
    return () => clearInterval(interval);
  }, [news]);

  const loadManagerName = () => {
    if (typeof window !== "undefined" && user) {
      const stored = localStorage.getItem(`apex_manager_name_${user.username}`);
      setManagerName(stored || user.username);
    }
  };

  useEffect(() => {
    loadManagerName();
    window.addEventListener("squad-updated", loadManagerName);
    return () => window.removeEventListener("squad-updated", loadManagerName);
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Fetch Squad
        const squadRes = await api.get("/squads/", { params: { user_id: user.id } });
        const activeSquadSummary = squadRes.data?.[0];
        if (activeSquadSummary) {
          const detailRes = await api.get(`/squads/${activeSquadSummary.id}`);
          const detailData = detailRes.data;
          setSquad(detailData);

          // Fetch squad player profiles to calculate dynamic stats
          const players = detailData.players || [];
          const profiles: any[] = [];
          await Promise.all(
            players.map(async (p: any) => {
              try {
                const res = await api.get(`/players/${p.player_id}`);
                profiles.push({
                  ...res.data,
                  position_slot: p.position
                });
              } catch (err) {
                console.error("Error loading squad player profile on dashboard:", p.player_id, err);
              }
            })
          );
          setSquadProfiles(profiles);
        }

        // 2. Fetch Watchlist count & items
        const watchRes = await api.get(`/watchlist/${user.id}`);
        const watchItems = watchRes.data || [];
        setWatchlistCount(watchItems.length);
        
        // Fetch details of first 3 watchlisted players
        const top3Watch = watchItems.slice(0, 3);
        const watchDetails = await Promise.all(
          top3Watch.map(async (w: any) => {
            try {
              const res = await api.get(`/players/${w.player_id}`);
              return res.data;
            } catch {
              return null;
            }
          })
        );
        setWatchlistPlayers(watchDetails.filter(Boolean));

        // 3. Fetch Top 3 AI Gems
        const gemsRes = await api.get("/ai/hidden-gems", { params: { limit: 3 } });
        setGems(gemsRes.data || []);

        // 4. Fetch Football News Feed
        try {
          const newsRes = await api.get("/news/football");
          setNews(newsRes.data || []);
        } catch (newsErr) {
          console.error("Error loading news feed on dashboard:", newsErr);
        }

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatValue = (val: number) => {
    if (!val) return "€0.0";
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  const getStarterCount = () => {
    if (!squad) return 0;
    return squad.players.filter((p: any) => p.position.indexOf("_") === -1 || p.position.endsWith("_0")).length;
  };

  const chemistryBreakdown = (() => {
    if (squadProfiles.length === 0) return calculateAdvancedChemistry([]);
    const starters = squadProfiles.filter(p => p.position_slot.indexOf("_") === -1 || p.position_slot.endsWith("_0"));
    return calculateAdvancedChemistry(starters);
  })();

  const chemistryScore = chemistryBreakdown.overallScore;
  const getChemistryDescription = () => chemistryBreakdown.statusMessage;

  if (authLoading || (user && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardBackground />
      <div className="relative z-10 p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
              Scouting Control Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1 animate-fade-in">
              Welcome back, Coach <span className="text-primary font-bold">{managerName}</span>. Analyze performance and optimize your roster lineups.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => router.push("/scout")}
              className="font-bold flex items-center gap-2"
            >
              Start Scouting
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* Real-time Football News Feed Section (Netflix Spotlight Carousel style) */}
        <section className="space-y-3 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4.5 w-4.5 text-primary animate-pulse" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Football News Spotlight</h3>
            </div>
            <a 
              href="https://www.skysports.com/football" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              Sky Sports Football
              <ChevronRight size={12} />
            </a>
          </div>

          {news.length > 0 ? (
            (() => {
              const currentItem = news[activeNewsIdx];
              const parsedDate = currentItem.pub_date ? new Date(currentItem.pub_date) : null;
              const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
              const dateStr = isValidDate 
                ? parsedDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : "Spotlight News";

              return (
                <div className="relative w-full min-h-[300px] md:min-h-[340px] rounded-3xl overflow-hidden border border-border/40 shadow-xl bg-card/45 backdrop-blur-md flex flex-col justify-end p-6 md:p-10 group hover:border-primary/20 transition-all duration-300">
                  {/* Background cover image or fallback gradient */}
                  {currentItem.image_url ? (
                    <>
                      <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform scale-100 group-hover:scale-[1.01]" style={{ backgroundImage: `url(${currentItem.image_url})` }}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#061d15] via-background to-[#0e1a24]"></div>
                  )}

                  {/* Spotlight Article Content Overlay */}
                  <div className="relative z-10 space-y-3 max-w-3xl animate-fade-in">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                      <Sparkles size={10} className="text-primary" />
                      {dateStr}
                    </span>
                    <h2 
                      onClick={() => window.open(currentItem.link, "_blank", "noopener,noreferrer")}
                      className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight cursor-pointer hover:text-primary transition duration-200"
                    >
                      {currentItem.title}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed line-clamp-3 md:line-clamp-2 max-w-2xl">
                      {currentItem.description}
                    </p>

                    <div className="pt-2 flex items-center gap-4">
                      <Button
                        onClick={() => window.open(currentItem.link, "_blank", "noopener,noreferrer")}
                        className="font-extrabold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 cursor-pointer shadow-lg px-6 h-11 rounded-xl transition duration-300 transform active:scale-95"
                      >
                        Read Full Article
                        <ArrowRight size={16} />
                      </Button>

                      {/* Manual Carousel controls */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => setActiveNewsIdx((prev) => (prev - 1 + Math.min(news.length, 6)) % Math.min(news.length, 6))}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/80 text-foreground transition cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setActiveNewsIdx((prev) => (prev + 1) % Math.min(news.length, 6))}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/80 text-foreground transition cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dots Indicators at top right */}
                  <div className="absolute top-6 right-6 z-10 flex gap-1.5">
                    {news.slice(0, Math.min(news.length, 6)).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveNewsIdx(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeNewsIdx === i ? "w-6 bg-primary" : "w-1.5 bg-slate-500/60 hover:bg-slate-400"
                        }`}
                      ></button>
                    ))}
                  </div>

                </div>
              );
            })()
          ) : (
            <div className="w-full min-h-[300px] flex flex-col items-center justify-center bg-muted/5 border border-border/50 rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground text-xs italic">Connecting live football channels...</p>
            </div>
          )}
        </section>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Active Budget Card */}
          <div className="p-5 border border-border/40 bg-card/45 backdrop-blur-md rounded-3xl flex items-center gap-4 shadow-sm hover:border-emerald-500/20 transition duration-300">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Available Budget</span>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {squad ? formatValue(squad.budget) : "€750.0M"}
              </span>
            </div>
          </div>

          {/* Active Squad Lineup Card */}
          <div className="p-5 border border-border/40 bg-card/45 backdrop-blur-md rounded-3xl flex items-center gap-4 shadow-sm hover:border-primary/20 transition duration-300">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Scouting Lineup</span>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {squad ? `${getStarterCount()}/11` : "0/11"} Starters
              </span>
            </div>
          </div>

          {/* Watchlisted Players Card */}
          <div className="p-5 border border-border/40 bg-card/45 backdrop-blur-md rounded-3xl flex items-center gap-4 shadow-sm hover:border-amber-500/20 transition duration-300">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Eye size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Watchlist Targets</span>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {watchlistCount} Players
              </span>
            </div>
          </div>

        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Panel 1: Squad Status */}
          <div className="lg:col-span-2 p-6 border border-border/40 bg-card/45 backdrop-blur-md rounded-3xl flex flex-col justify-between space-y-6 shadow-md hover:border-primary/20 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏟️</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Scouting Squad Status</h3>
                </div>
                <Link href="/squad" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  Manage Lineup
                  <ChevronRight size={12} />
                </Link>
              </div>

              {squad ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {/* Left stats list */}
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground font-medium">Squad Name</span>
                      <span className="font-extrabold text-foreground">{squad.squad_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground font-medium">Active Formation</span>
                      <span className="font-extrabold text-primary uppercase">{squad.formation}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground font-medium">Starter Players</span>
                      <span className="font-extrabold text-foreground">{getStarterCount()} / 11</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Sub Backups</span>
                      <span className="font-extrabold text-foreground">{squad.players.length - getStarterCount()} Players</span>
                    </div>
                  </div>

                  {/* Right: Chemistry gauge */}
                  <div className="bg-muted/10 border border-border/60 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tactical Team Chemistry</span>
                    <span className="text-3xl font-black text-primary">{chemistryScore} / 100</span>
                    <div className="w-full max-w-[160px] bg-secondary h-2.5 rounded-full overflow-hidden border border-border/30">
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${chemistryScore}%` }}></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mt-1 max-w-[180px]">
                      {getChemistryDescription()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <p className="text-muted-foreground text-xs italic">No active squad found.</p>
                  <Button onClick={() => router.push("/squad")} size="sm" variant="outline">
                    Create Squad
                  </Button>
                </div>
              )}
            </div>

            {/* AI tactical Assistant Banner inside squad */}
            <div className="relative overflow-hidden bg-[#182c3c]/85 border border-sky-950/30 rounded-2xl p-5 flex items-center justify-between group">
              <div className="space-y-1.5 z-10 max-w-[70%]">
                <div className="flex items-center gap-1.5 text-sky-400">
                  <Bot size={14} className="animate-bounce" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">AI Tactical Assistant</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">Need structural advice for transitions?</h4>
                <p className="text-xs text-sky-200/70 leading-relaxed">
                  Chat with our tactical bot to design press triggers, tiki-taka patterns, and high-possession styles.
                </p>
              </div>

              <Button 
                onClick={() => router.push("/tactics")}
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shrink-0 gap-1 shadow-lg transition duration-300"
              >
                Launch
                <ArrowRight size={12} />
              </Button>
              <div className="absolute right-0 bottom-0 opacity-10 text-[100px] font-black z-0 pointer-events-none select-none translate-x-4 translate-y-6">AI</div>
            </div>

          </div>

          {/* Panel 2: Watchlist Summary */}
          <div className="p-6 border border-border/40 bg-card/45 backdrop-blur-md rounded-3xl flex flex-col justify-between space-y-6 shadow-md hover:border-amber-500/20 transition-all duration-300">
            <div className="space-y-4 flex-grow">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">⭐</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Scout Watchlist</h3>
                </div>
                <Link href="/watchlist" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  View All
                  <ChevronRight size={12} />
                </Link>
              </div>

              {watchlistPlayers.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {watchlistPlayers.map((player) => (
                    <div 
                      key={player.id} 
                      onClick={() => router.push(`/analytics?id=${player.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-muted/15 cursor-pointer rounded-lg px-2 transition duration-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={player.photo || DEFAULT_AVATAR} 
                          alt={player.name} 
                          className="w-8 h-8 rounded-full object-cover bg-muted border border-border/40"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                        />
                        <div>
                          <h4 className="font-extrabold text-xs text-foreground truncate max-w-[120px]">{player.name}</h4>
                          <p className="text-[9px] text-muted-foreground uppercase">{player.position?.split(",")[0]} • {player.club}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          OVR {player.overall}
                        </span>
                        <p className="text-[9px] text-muted-foreground mt-0.5 font-bold">{formatValue(player.marketValue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 space-y-2">
                  <p className="text-muted-foreground text-xs italic">Watchlist is currently empty.</p>
                  <p className="text-[10px] text-muted-foreground">Add targets during analytics scouting searches.</p>
                </div>
              )}
            </div>

            {/* Model Accuracy Ribbon info */}
            <div className="bg-secondary/45 border border-border/60 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-amber-500" />
                <div>
                  <span className="font-extrabold block text-foreground leading-none">ML Price Accuracy</span>
                  <span className="text-[9px] text-muted-foreground">Random Forest Classifier</span>
                </div>
              </div>
              <span className="font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">R²: 94.28%</span>
            </div>

          </div>

        </div>

        {/* AI Undervalued Gems Grid */}
        <section className="space-y-4">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">AI Undervalued Gems</h3>
            </div>
            <Link href="/watchlist" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Scout All Gems
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gems.length > 0 ? (
              gems.map((gem) => (
                <div 
                  key={gem.fifa_id}
                  onClick={() => router.push(`/analytics?id=${gem.fifa_id}`)}
                  className="p-4 border border-border/40 bg-card/45 backdrop-blur-md rounded-3xl hover:border-primary/40 cursor-pointer shadow hover:shadow-md transition duration-300 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={gem.face_url || DEFAULT_AVATAR} 
                      alt={gem.name} 
                      className="w-10 h-10 rounded-full object-cover bg-muted border border-border/40"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-foreground group-hover:text-primary transition duration-200">{gem.name}</h4>
                      <p className="text-[9px] text-muted-foreground uppercase">POT {gem.potential} • {gem.age} yrs</p>
                      <span className="inline-block text-[8px] bg-rose-500/10 text-rose-400 font-extrabold px-1.5 py-0.5 rounded mt-1">
                        Undervalued
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      OVR {gem.overall}
                    </span>
                    <p className="text-[10px] font-bold text-foreground mt-1.5">{formatValue(gem.value_eur)}</p>
                    <p className="text-[8px] text-emerald-400 font-bold leading-none mt-0.5">Est. Peak: {formatValue(gem.predicted_value_eur)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground text-xs italic">Loading AI undervalued Gems details...</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </ProtectedRoute>
  );
}