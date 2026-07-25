"use client";

import { useState, useEffect } from "react";
import { getHiddenGems } from "../../services/api";
import { Gem, TrendingUp, DollarSign, Loader2 } from "lucide-react";

export default function HiddenGemsTab() {
  const [gems, setGems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGems = async () => {
      try {
        const data = await getHiddenGems(15);
        setGems(data);
      } catch (err: any) {
        setError("Failed to fetch hidden gems from AI service.");
      } finally {
        setLoading(false);
      }
    };
    fetchGems();
  }, []);

  const formatCurrency = (val: number) => {
    if (!val) return "Unknown";
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    return `€${(val / 1000).toFixed(0)}K`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/20 rounded-xl">
          <Gem className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Gem Radar</h2>
          <p className="text-gray-400 text-sm">Identifying massively undervalued high-potential youth talent.</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {gems.map((player, idx) => (
            <div key={idx} className="group flex bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300">
              
              {/* Left Rank */}
              <div className="flex flex-col justify-center pr-6 border-r border-white/10 mr-6">
                <span className="text-4xl font-black text-white/20 group-hover:text-purple-500/30 transition-colors">#{idx + 1}</span>
              </div>

              {/* Center Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{player.name}</h3>
                  <div className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 font-bold text-sm">{player.hidden_gem_score} Score</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span>Age: <strong className="text-white">{player.age}</strong></span>
                  <span>OVR: <strong className="text-white">{player.overall}</strong></span>
                  <span>POT: <strong className="text-emerald-400">{player.potential}</strong></span>
                </div>

                {/* Values Comparison */}
                <div className="flex gap-4 p-3 bg-black/20 rounded-xl">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Market Value</p>
                    <p className="font-medium text-gray-300">{formatCurrency(player.value_eur)}</p>
                  </div>
                  <div className="flex-1 border-l border-white/10 pl-4">
                    <p className="text-[10px] text-purple-400 uppercase font-bold mb-1">AI True Value</p>
                    <p className="font-bold text-purple-400">{formatCurrency(player.predicted_value_eur)}</p>
                  </div>
                  <div className="flex-1 border-l border-white/10 pl-4">
                    <p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Undervaluation</p>
                    <p className="font-black text-emerald-400">+{formatCurrency(player.undervaluation_gap)}</p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
