"use client";

import { useState, useEffect } from "react";
import PlayerCard from "./PlayerCard";
import { useScout } from "./ScoutContext";
import { useSidebar } from "@/components/layout/SidebarContext";
import api from "@/lib/api";
import { Player } from "./type";
import { DEFAULT_AVATAR } from "@/lib/utils";

export default function PlayerGrid() {
  const {
    search,
    sort,
    view,
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
  } = useScout();

  const { collapsed } = useSidebar();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            sort_by: sort,
            descending: sort !== "age",
          }
        });
        if (active) {
          const mapped = (response.data.players || []).map((p: any) => ({
            id: p.fifa_id || p.id,
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
            progressiveCarries: p.progressive_carries || 0,
            progressivePasses: p.progressive_passes || 0,
            goals: p.goals || 0,
            passAccuracy: p.passing || p.pass_accuracy || 0,
            height: p.height_cm || 0,
            weight: p.weight_kg || 0,
          }));
          setPlayers(mapped);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          console.error("Error fetching players:", err);
          setError(err.message || "Failed to load players");
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
    sort,
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-lg font-semibold text-destructive">Error Loading Players</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-center text-muted-foreground">
        No players found matching current filters.
      </div>
    );
  }

  return (
    <div
      className={
        view === "grid"
          ? (collapsed && !showFilters)
            ? "grid gap-6 p-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            : "grid gap-6 p-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "flex flex-col gap-4 p-6"
      }
    >
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
        />
      ))}
    </div>
  );
}