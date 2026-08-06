"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { DEFAULT_AVATAR } from "@/lib/utils";

export default function PlayerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get("/players/", {
          params: { search: query, page_size: 6 }
        });
        setResults(response.data.players || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Error searching players:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (playerId: number) => {
    setQuery("");
    setShowDropdown(false);
    router.push(`/analytics?id=${playerId}`);
  };

  return (
    <div className="relative max-w-lg w-full z-50" ref={dropdownRef}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={18}
      />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
        placeholder="Search player..."
        className="pl-11 h-12 bg-card border-border focus:ring-2 focus:ring-primary w-full"
      />
      {loading && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" size={18} />
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((player) => (
            <div
              key={player.fifa_id}
              onClick={() => handleSelect(player.fifa_id)}
              className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
            >
              <img
                src={player.face_url || DEFAULT_AVATAR}
                alt={player.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover bg-secondary"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">{player.name}</p>
                <p className="text-xs text-muted-foreground">{player.club} • {player.position}</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                OVR {player.overall}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}