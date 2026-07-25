"use client";

import { useState } from "react";
import { getSimilarPlayers } from "../../services/api";
import { Search, Activity, Loader2 } from "lucide-react";

export default function PlayerSimilarityTab() {
  const [fifaId, setFifaId] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!fifaId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getSimilarPlayers(parseInt(fifaId));
      setResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to fetch similar players");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={fifaId}
            onChange={(e) => setFifaId(e.target.value)}
            placeholder="Enter FIFA ID (e.g. 158023 for Messi)"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-gray-500 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !fifaId}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
          Find Replacements
        </button>
      </div>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {results.map((player, idx) => (
          <div key={idx} className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 overflow-hidden">
            {/* Glowing accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{player.name}</h3>
                <p className="text-gray-400 text-sm">{player.club} • {player.position}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-emerald-400">{player.overall}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">OVR</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-gray-400">AI Similarity Match</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" 
                    style={{ width: `${player.similarity_score}%` }}
                  />
                </div>
                <span className="text-emerald-400 font-bold text-sm">{player.similarity_score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && results.length === 0 && !error && (
        <div className="text-center py-20 text-gray-500 border border-white/5 rounded-2xl bg-white/5 border-dashed">
          Enter a Player ID above to see the AI's top statistical replacements.
        </div>
      )}
    </div>
  );
}
