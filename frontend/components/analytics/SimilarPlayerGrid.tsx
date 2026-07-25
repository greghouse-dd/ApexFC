"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PlayerCard from "../scout/PlayerCard";
import { useScout } from "../scout/ScoutContext";
import { useSidebar } from "@/components/layout/SidebarContext";
import api from "@/lib/api";
import { Player } from "../scout/type";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SimilarPlayer extends Player {
  similarityScore: number;
}

export default function SimilarPlayerGrid() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");

  const {
    search,
    sort,
    setSort,
    view,
    position,
    nationality,
    foot,
    minAge,
    maxAge,
    minOverall,
    minPotential,
    maxMarketValue,
    showFilters,
  } = useScout();

  const { collapsed } = useSidebar();

  const [targetPlayer, setTargetPlayer] = useState<any>(null);
  const [players, setPlayers] = useState<SimilarPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSort("similarity");
  }, []);

  useEffect(() => {
    if (!targetId) return;

    const fetchSimilarData = async () => {
      setLoading(true);
      try {
        // 1. Fetch target player details for the header
        const targetRes = await api.get(`/players/${targetId}`);
        setTargetPlayer(targetRes.data);

        // 2. Fetch similar players list from ML similarity endpoint
        const similarityRes = await api.get(`/ai/similarity/${targetId}`, {
          params: { k: 40 }
        });

        const mapped: SimilarPlayer[] = (similarityRes.data || []).map((p: any) => ({
          id: p.fifa_id,
          name: p.name,
          photo: p.face_url || DEFAULT_AVATAR,
          nationality: p.nationality || "",
          nationalityFlag: p.nation_flag || "🏳️",
          club: p.club || "",
          clubLogo: p.club_logo || "",
          position: p.position ? p.position.split(",")[0].trim() : "",
          league: "",
          season: "2023/2024",
          age: p.age || 0,
          foot: p.preferred_foot === "Left" ? "Left" : p.preferred_foot === "Right" ? "Right" : "Both",
          overall: p.overall,
          potential: p.potential || 0,
          marketValue: p.value_eur || 0,
          xG: 0,
          xA: 0,
          progressiveCarries: 0,
          progressivePasses: 0,
          goals: 0,
          passAccuracy: 0,
          height: 0,
          weight: 0,
          similarityScore: p.similarity_score || 0,
        }));

        setPlayers(mapped);
        setError(null);
      } catch (err: any) {
        console.error("Error loading similarity data:", err);
        setError(err.response?.data?.detail || "Player not found in ML similarity features database.");
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarData();
  }, [targetId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !targetPlayer) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center p-6">
        <p className="text-lg font-semibold text-destructive">{error || "No player specified."}</p>
        <Link 
          href="/analytics" 
          className="flex items-center gap-2 text-primary font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to Analytics
        </Link>
      </div>
    );
  }

  // Frontend Filtering
  const filtered = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const nameMatches = p.name.toLowerCase().includes(q);
      const clubMatches = p.club.toLowerCase().includes(q);
      if (!nameMatches && !clubMatches) return false;
    }
    if (position && !p.position.toLowerCase().includes(position.toLowerCase())) return false;
    if (nationality && p.nationality !== nationality) return false;
    if (foot && p.foot !== foot) return false;
    if (p.age < minAge || p.age > maxAge) return false;
    if (p.overall < minOverall) return false;
    if (p.potential < minPotential) return false;
    if (p.marketValue > maxMarketValue) return false;
    return true;
  });

  // Frontend Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "overall") return b.overall - a.overall;
    if (sort === "potential") return b.potential - a.potential;
    if (sort === "age") return a.age - b.age;
    if (sort === "value") return b.marketValue - a.marketValue;
    if (sort === "similarity") return b.similarityScore - a.similarityScore;
    // Default to similarity score descending
    return b.similarityScore - a.similarityScore;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Banner */}
      <div className="bg-muted/40 border-b border-border px-8 py-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              href={`/analytics?id=${targetPlayer.fifa_id || targetPlayer.id}`} 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <h2 className="text-xl font-bold tracking-tight">
              Scouting Similar Players to <span className="text-primary">{targetPlayer.name}</span>
            </h2>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Showing ML-matched profiles based on position, age, and skill traits
          </p>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Model ROC-AUC</span>
            <p className="text-lg font-black text-emerald-500">0.94</p>
          </div>
          <div className="h-8 w-px bg-border"></div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Rating</span>
            <p className="text-lg font-extrabold text-primary">{targetPlayer.overall} OVR</p>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
          No similar players match the selected filters. Try adjusting sidebar parameters.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div
            className={
              view === "grid"
                ? (collapsed && !showFilters)
                  ? "grid gap-6 p-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                  : "grid gap-6 p-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col gap-4 p-6"
            }
          >
            {sorted.map((player) => (
              <div key={player.id} className="relative group">
                {/* Visual similarity indicator */}
                <div className="absolute top-2 right-2 z-10 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow group-hover:scale-105 transition-transform">
                  {player.similarityScore}% Match
                </div>
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
