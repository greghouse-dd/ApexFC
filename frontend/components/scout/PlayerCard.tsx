"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayerAvatar from "./PlayerAvatar";
import PlayerBadge from "./PlayerBadge";
import PlayerRating from "./PlayerRating";
import { useScout } from "./ScoutContext";
import { Player } from "./type";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";

interface Props {
  player: Player;
}

export default function PlayerCard({ player }: Props) {
  const router = useRouter();
  const { view } = useScout();
  const { user } = useAuth();
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/watchlist/check/${user.id}/${player.id}`);
        setIsWatchlisted(res.data.watchlisted);
      } catch (err) {
        // Silently swallow errors
      }
    };
    checkStatus();
  }, [user, player.id]);

  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering parent router navigation!
    if (!user) {
      toast.error("Please login to manage watchlist.");
      return;
    }
    try {
      if (isWatchlisted) {
        await api.delete(`/watchlist/${player.id}`, { params: { user_id: user.id } });
        setIsWatchlisted(false);
        toast.success(`${player.name} removed from watchlist.`);
      } else {
        await api.post("/watchlist/", {
          user_id: user.id,
          player_id: player.id,
          notes: ""
        });
        setIsWatchlisted(true);
        toast.success(`${player.name} added to watchlist!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update watchlist.");
    }
  };

  if (view === "list") {
    return (
      <div
        onClick={() => router.push(`/analytics?id=${player.id}`)}
        className="
          cursor-pointer
          rounded-xl
          border border-border/40
          bg-card/60
          backdrop-blur-xs
          px-5
          py-3
          shadow-sm
          transition-all
          duration-200
          hover:bg-card/85
          hover:border-primary
          hover:shadow-md
          flex
          flex-col
          sm:flex-row
          sm:items-center
          justify-between
          gap-4
        "
      >
        <div className="flex items-center gap-4 flex-1">
          <PlayerAvatar image={player.photo} />
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-semibold truncate max-w-[150px] sm:max-w-none">
                {player.name}
              </h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                OVR {player.overall}
              </span>
            </div>
            <PlayerBadge
              flag={player.nationalityFlag}
              club={player.club}
              position={player.position}
            />
          </div>
        </div>

        {/* Age, Foot, Potential, Value to the right */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-sm">
          <Info label="Age" value={player.age} inline />
          <Info label="Foot" value={player.foot} inline />
          <Info label="Potential" value={player.potential} inline />
          <Info 
            label="Value" 
            value={
              player.marketValue >= 1000000
                ? `€${(player.marketValue / 1000000).toFixed(0)}M`
                : player.marketValue >= 1000
                  ? `€${(player.marketValue / 1000).toFixed(0)}K`
                  : `€${player.marketValue}`
            } 
            inline 
          />
          <button
            onClick={handleToggleWatchlist}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            <Bookmark className={`h-4.5 w-4.5 ${isWatchlisted ? "text-primary fill-primary animate-pulse" : ""}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/analytics?id=${player.id}`)}
      className="
        cursor-pointer
        rounded-2xl
        border border-border/40
        bg-card/60
        backdrop-blur-xs
        p-5
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:bg-card/80
        hover:border-primary
        hover:shadow-xl
      "
    >
      {/* Header */}
      <div className="flex justify-between">
        <div className="flex gap-4">
          <PlayerAvatar image={player.photo} />

          <div>
            <h3 className="text-lg font-semibold">
              {player.name}
            </h3>

            <PlayerBadge
              flag={player.nationalityFlag}
              club={player.club}
              position={player.position}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <PlayerRating rating={player.overall} />
          <button
            onClick={handleToggleWatchlist}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            <Bookmark className={`h-4 w-4 ${isWatchlisted ? "text-primary fill-primary animate-pulse" : ""}`} />
          </button>
        </div>
      </div>

      <hr className="my-5" />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Info
          label="Age"
          value={player.age}
        />

        <Info
          label="Foot"
          value={player.foot}
        />

        <Info
          label="Potential"
          value={player.potential}
        />

        <Info
          label="Value"
          value={
            player.marketValue >= 1000000
              ? `€${(player.marketValue / 1000000).toFixed(0)}M`
              : player.marketValue >= 1000
                ? `€${(player.marketValue / 1000).toFixed(0)}K`
                : `€${player.marketValue}`
          }
        />
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  inline = false,
}: {
  label: string;
  value: string | number;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className="font-semibold">{value}</span>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="font-semibold">
        {value}
      </p>
    </div>
  );
}