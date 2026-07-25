"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PlayerSearch from "../analytics/PlayerSearch";
import { useAuth } from "@/components/providers/AuthProvider";
import api from "@/lib/api";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [budget, setBudget] = useState<number | null>(null);
  const [managerName, setManagerName] = useState("Asher");
  const [squadName, setSquadName] = useState("");

  const loadManagerProfile = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("apex_manager_name");
      if (stored) {
        setManagerName(stored);
      } else if (user) {
        setManagerName(user.username || "Asher");
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "AW";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const fetchBudget = async () => {
    if (!user) return;
    try {
      const res = await api.get("/squads/", { params: { user_id: user.id } });
      const activeSquad = res.data?.[0];
      if (activeSquad) {
        setBudget(activeSquad.budget);
        setSquadName(activeSquad.squad_name);
      }
    } catch (err) {
      console.error("Error fetching budget for header:", err);
    }
  };

  useEffect(() => {
    fetchBudget();
    loadManagerProfile();
  }, [user, pathname]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchBudget();
      loadManagerProfile();
    };
    window.addEventListener("squad-updated", handleUpdate);
    return () => window.removeEventListener("squad-updated", handleUpdate);
  }, [user]);

  const formatValue = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card/50 backdrop-blur-md px-8">

      {/* Left */}
      <div className="flex items-center gap-6">
        {squadName && (
          <div className="relative flex items-center justify-center px-4 py-2 select-none min-h-[40px]">
            {/* Logo behind the club name */}
            <div 
              className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-15 pointer-events-none"
              style={{ backgroundImage: "url('/logo.png')" }}
            />
            <span className="relative z-10 text-sm font-black tracking-widest uppercase text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
              {squadName}
            </span>
          </div>
        )}
        <div className="w-72 sm:w-80">
          <PlayerSearch />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        
        {/* Available Budget Badge */}
        {budget !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs shadow-sm">
            <Wallet size={12} className="text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden md:inline">Remaining Budget:</span>
            <span>{formatValue(budget)}</span>
          </div>
        )}


        <Link href="/settings" title="Settings">
          <Settings className="cursor-pointer text-muted-foreground hover:text-primary" />
        </Link>

        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(managerName)}</AvatarFallback>
          </Avatar>

          <div className="leading-tight">
            <p className="font-medium">{managerName}</p>
            <p className="text-xs text-muted-foreground">Scout</p>
          </div>
        </div>

      </div>

    </header>
  );
}