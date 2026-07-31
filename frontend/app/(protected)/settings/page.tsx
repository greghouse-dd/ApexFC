"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Users,
  Settings,
  Sliders,
  Trash2,
  Save,
  Palette,
  Coins,
  Check,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Sparkles,
  Info
} from "lucide-react";



const VALID_FORMATIONS = [
  "4-3-3",
  "4-4-2",
  "3-5-2",
  "3-4-3",
  "4-2-3-1",
  "5-3-2",
  "5-4-1"
];

const PLAY_STYLES = [
  { name: "Tiki-Taka", desc: "Short, quick passing, possession control and high pressing." },
  { name: "Gegenpressing", desc: "Heavy counter-pressing, high energy, and intense physical workrate." },
  { name: "Direct Counter", desc: "Low defensive block, long passes to quick wingers, fast breaks." },
  { name: "Wing Play", desc: "Spreading the play wide, overlapping fullbacks, crossing focus." },
  { name: "Catenaccio (Park the Bus)", desc: "Hyper-focused defensive discipline, compact lines, safety first." }
];

const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" }
];

const COLOR_SCHEMES = [
  { name: "Emerald Mint", primary: "#10b981", secondary: "#06b6d4", bg: "from-emerald-500 to-cyan-500" },
  { name: "Electric Blue", primary: "#3b82f6", secondary: "#8b5cf6", bg: "from-blue-500 to-purple-500" },
  { name: "Crimson Gold", primary: "#ef4444", secondary: "#f59e0b", bg: "from-red-500 to-amber-500" },
  { name: "Neon Rose", primary: "#ec4899", secondary: "#f43f5e", bg: "from-pink-500 to-rose-500" },
  { name: "Carbon Tech", primary: "#64748b", secondary: "#94a3b8", bg: "from-slate-500 to-gray-400" }
];

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"club" | "budget" | "tactics">("club");
  const [squad, setSquad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Club details state
  const [squadName, setSquadName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [clubEmoji, setClubEmoji] = useState("⚽");
  const [selectedColor, setSelectedColor] = useState(COLOR_SCHEMES[0]);

  // Financial control state
  const [totalBudget, setTotalBudget] = useState(750000000); // 750M default
  const [budgetSliderValue, setBudgetSliderValue] = useState(750000000);
  const [budgetWarning, setBudgetWarning] = useState("");

  // Tactical strategy state
  const [formation, setFormation] = useState("4-3-3");
  const [selectedPlaystyle, setSelectedPlaystyle] = useState("Gegenpressing");
  const [tempoSlider, setTempoSlider] = useState(50);
  const [lineHeightSlider, setLineHeightSlider] = useState(50);

  // App settings state
  const [currency, setCurrency] = useState("EUR");

  // Fetch squad configuration on load
  const fetchSquadDetails = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get("/squads/", { params: { user_id: user.id } });
      let activeSquad = res.data?.[0];

      // Auto-create squad if user has none
      if (!activeSquad) {
        const createRes = await api.post(`/squads/?user_id=${user.id}`, {
          squad_name: "ApexFC",
          formation: "4-3-3"
        });
        activeSquad = createRes.data;
      }

      // Fetch squad summary for accurate values
      const summaryRes = await api.get(`/squads/${activeSquad.id}/summary`);
      const details = summaryRes.data;
      setSquad(details);

      // Set page state from API values
      setSquadName(details.squad_name || "ApexFC");
      setFormation(details.formation || "4-3-3");

      // Total budget = remaining budget + squad value
      const total = details.remaining_budget + details.squad_value;
      setTotalBudget(total);
      setBudgetSliderValue(total);

      // Local storage profile settings
      if (typeof window !== "undefined") {
        setManagerName(localStorage.getItem(`apex_manager_name_${user.username}`) || user.username);
        setClubEmoji(localStorage.getItem("apex_club_emoji") || "⚽");
        const storedColor = localStorage.getItem("apex_color_scheme");
        if (storedColor) {
          const found = COLOR_SCHEMES.find(c => c.name === storedColor);
          if (found) setSelectedColor(found);
        }
        setCurrency(localStorage.getItem("apex_currency") || "EUR");
        setSelectedPlaystyle(localStorage.getItem("apex_playstyle") || "Gegenpressing");
        setTempoSlider(Number(localStorage.getItem("apex_tempo")) || 65);
        setLineHeightSlider(Number(localStorage.getItem("apex_line_height")) || 70);
      }

    } catch (err) {
      console.error("Error fetching squad details in settings:", err);
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquadDetails();
  }, [user]);

  // Handle budget updates & warning checks
  useEffect(() => {
    if (!squad) return;
    const remaining = totalBudget - squad.squad_value;
    if (remaining < 0) {
      setBudgetWarning(`WARNING: The new budget is lower than your current squad roster value (€${(squad.squad_value / 1000000).toFixed(1)}M). Saving this will result in a negative remaining balance.`);
    } else {
      setBudgetWarning("");
    }
  }, [totalBudget, squad]);

  // Format monetary value
  const formatCurrency = (val: number) => {
    const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || "€";
    if (val >= 1000000000) return `${symbol}${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `${symbol}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${symbol}${(val / 1000).toFixed(0)}K`;
    return `${symbol}${val}`;
  };

  // 1. SAVE CLUB DETAILS
  const handleSaveClub = async () => {
    if (!user || !squad) return;
    if (squadName.trim().length < 3) {
      toast.error("Squad Name must be at least 3 characters.");
      return;
    }

    setSaving(true);
    try {
      // API call to update name
      await api.patch(`/squads/${squad.squad_id}`, { squad_name: squadName });

      // Save additional aesthetic items locally
      localStorage.setItem(`apex_manager_name_${user.username}`, managerName);
      localStorage.setItem("apex_club_emoji", clubEmoji);
      localStorage.setItem("apex_color_scheme", selectedColor.name);

      window.dispatchEvent(new Event("squad-updated"));
      toast.success("Club details updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update squad name.");
    } finally {
      setSaving(false);
    }
  };

  // 2. SAVE BUDGET DETAILS (Financial settings)
  const handleSaveBudget = async () => {
    if (!squad) return;
    setSaving(true);
    try {
      const newRemainingBudget = totalBudget - squad.squad_value;

      // API call to patch budget
      await api.patch(`/squads/${squad.squad_id}`, { budget: newRemainingBudget });

      // Fetch squad summary for updated balance sheet
      const summaryRes = await api.get(`/squads/${squad.squad_id}/summary`);
      setSquad(summaryRes.data);

      window.dispatchEvent(new Event("squad-updated"));
      toast.success(`Squad budget updated! Remaining cash: ${formatCurrency(newRemainingBudget)}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update budget.");
    } finally {
      setSaving(false);
    }
  };

  // 3. SAVE TACTICAL STRATEGY
  const handleSaveTactics = async () => {
    if (!squad) return;
    setSaving(true);
    try {
      // Patch formation in backend
      await api.patch(`/squads/${squad.squad_id}`, { formation: formation });

      // Save tactical values locally
      localStorage.setItem("apex_playstyle", selectedPlaystyle);
      localStorage.setItem("apex_tempo", String(tempoSlider));
      localStorage.setItem("apex_line_height", String(lineHeightSlider));

      window.dispatchEvent(new Event("squad-updated"));
      toast.success("Tactics presets updated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update tactical settings.");
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0d0f12]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm font-semibold text-muted-foreground">Loading settings configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen background image behind sidebar and header */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: "url('/images/settings/setting-1.jpg')" }}
      />
      {/* Dark overlay for contrast and readability */}
      <div className="fixed inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none z-0" />

      <div className="min-h-[calc(100vh-64px)] text-foreground p-6 md:p-10 relative z-10 bg-transparent w-full">

        {/* Title Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-8 h-8 text-emerald-400" />
            Club Settings & Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Configure manager profile, set squad budget limitations, optimize tactical blueprints, or reset club data.
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Left Hand Tab Navigation (Vertical) */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {[
              { id: "club", label: "Club Profile", icon: Users, color: "text-emerald-400" },
              { id: "budget", label: "Budget Setter", icon: Wallet, color: "text-emerald-400" },
              { id: "tactics", label: "Tactics & Playstyle", icon: Sliders, color: "text-emerald-400" }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-bold text-left transition duration-200 cursor-pointer border ${active
                    ? "bg-card/90 text-white border-l-4 border-emerald-500 shadow-md shadow-emerald-500/5"
                    : "text-muted-foreground border-transparent hover:bg-card/60 hover:text-white"
                    }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? tab.color : "opacity-60"}`} />
                  <span>{tab.label}</span>
                  {active && <ChevronRight className="ml-auto w-4 h-4 text-emerald-500" />}
                </button>
              );
            })}

            {/* Quick Stats Panel */}
            {squad && (
              <div className="mt-6 p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-border/40 text-xs">
                <h3 className="font-bold text-muted-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Active Club Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Club Name:</span>
                    <span className="font-semibold text-white">{squad.squad_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roster Value:</span>
                    <span className="font-semibold text-white">{formatCurrency(squad.squad_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Cash:</span>
                    <span className="font-semibold text-emerald-400 font-bold">{formatCurrency(squad.remaining_budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formation:</span>
                    <span className="font-semibold text-white">{squad.formation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Hand Tab Content */}
          <div className="lg:col-span-3 space-y-6">

            {/* TAB 1: CLUB PROFILE */}
            {activeTab === "club" && (
              <Card className="bg-card/65 backdrop-blur-md border-border/40 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

                <div className="flex items-center gap-3 mb-6 border-b border-[#1d242e] pb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Club Profile</h2>
                    <p className="text-xs text-muted-foreground">Modify details about your manager, squad name, and visual layout brand.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Grid Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Squad/Club Name</label>
                      <Input
                        value={squadName}
                        onChange={(e) => setSquadName(e.target.value)}
                        placeholder="e.g. Apex FC"
                        className="bg-[#181d24] border-[#222b39] text-white focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Manager Name</label>
                      <Input
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="e.g. Asher"
                        className="bg-[#181d24] border-[#222b39] text-white focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Club Identity Emojis */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Club Logo Badge / Emoji</label>
                    <div className="flex flex-wrap gap-2">
                      {["⚽", "🏆", "🛡️", "🦁", "🦅", "⚡", "🔴", "🔵", "🟢", "⚔️", "👑", "🔥"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setClubEmoji(emoji)}
                          className={`w-11 h-11 text-xl flex items-center justify-center rounded-xl cursor-pointer transition ${clubEmoji === emoji
                            ? "bg-emerald-500/20 border border-emerald-500 text-white scale-110 shadow-md shadow-emerald-500/10"
                            : "bg-[#181d24] hover:bg-[#222b39] text-gray-400 border border-transparent"
                            }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Brand Color Palette */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-muted-foreground">Visual Dashboard Scheme</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {COLOR_SCHEMES.map((scheme) => {
                        const active = selectedColor.name === scheme.name;
                        return (
                          <button
                            key={scheme.name}
                            onClick={() => setSelectedColor(scheme)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition ${active
                              ? "bg-[#181d24] border-emerald-500 text-white shadow-md shadow-emerald-500/5"
                              : "bg-[#13171e] border-[#222b39] text-muted-foreground hover:bg-[#181d24]/60 hover:text-white"
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${scheme.bg} flex shrink-0 items-center justify-center text-white`}>
                              {active && <Check className="w-4 h-4 text-white drop-shadow" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{scheme.name}</p>
                              <div className="flex gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scheme.primary }} />
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scheme.secondary }} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-4 border-t border-[#1d242e] flex justify-end">
                    <Button
                      onClick={handleSaveClub}
                      disabled={saving}
                      className="bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-black flex items-center gap-2 cursor-pointer rounded-xl px-5"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* TAB 2: BUDGET SETTER TOOL */}
            {activeTab === "budget" && (
              <Card className="bg-card/65 backdrop-blur-md border-border/40 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

                <div className="flex items-center gap-3 mb-6 border-b border-[#1d242e] pb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Financial Control & Budget Setter</h2>
                    <p className="text-xs text-muted-foreground">Adjust the total cash constraints available for recruitment operations.</p>
                  </div>
                </div>

                {squad && (
                  <div className="space-y-6">

                    {/* Financial Balance Sheet Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-card/50 border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Squad Roster Value</span>
                        <div>
                          <span className="text-xl font-black text-white">{formatCurrency(squad.squad_value)}</span>
                          <span className="text-[10px] text-muted-foreground block mt-1">Value of {squad.total_players} players on contract</span>
                        </div>
                      </div>

                      <div className="bg-card/50 border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Available Remaining Cash</span>
                        <div>
                          <span className={`text-xl font-black ${(totalBudget - squad.squad_value) >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                            {formatCurrency(totalBudget - squad.squad_value)}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-1">Cash left for player acquisitions</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/5 border border-emerald-500/25 rounded-2xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block mb-1">Total Allocated Budget</span>
                        <div>
                          <span className="text-xl font-black text-white">{formatCurrency(totalBudget)}</span>
                          <span className="text-[10px] text-muted-foreground block mt-1">Board-allocated transfer cap</span>
                        </div>
                      </div>
                    </div>

                    {/* Warning Messages */}
                    {budgetWarning && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                        <span>{budgetWarning}</span>
                      </div>
                    )}



                    {/* Manual Budget Input and Sliders */}
                    <div className="space-y-4 pt-4 border-t border-[#1d242e]">

                      <div className="flex justify-between items-center gap-4 flex-wrap">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Total Transfer Budget Cap</label>
                          <p className="text-xs text-muted-foreground">Adjust manually or input a raw number</p>
                        </div>

                        <div className="relative w-full max-w-sm sm:w-60">
                          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={totalBudget}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setTotalBudget(val);
                              setBudgetSliderValue(val);
                            }}
                            className="bg-[#181d24] border-[#222b39] text-white pl-9 pr-4 text-sm font-bold focus-visible:ring-emerald-500 text-right"
                          />
                        </div>
                      </div>

                      {/* Range Slider for Interactive Budget Selection */}
                      <div className="space-y-2 bg-card/50 border border-border/40 p-4 rounded-xl">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Min (€10M)</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(totalBudget)}</span>
                          <span>Max (€2.0B)</span>
                        </div>
                        <input
                          type="range"
                          min="10000000"
                          max="2000000000"
                          step="10000000"
                          value={budgetSliderValue}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBudgetSliderValue(val);
                            setTotalBudget(val);
                          }}
                          className="w-full accent-emerald-400 h-2 bg-[#12161b] rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Action Save */}
                    <div className="pt-4 border-t border-[#1d242e] flex justify-between items-center">
                      <span className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Adjusting budget scales available funds instantly.
                      </span>
                      <Button
                        onClick={handleSaveBudget}
                        disabled={saving}
                        className="bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-black flex items-center gap-2 cursor-pointer rounded-xl px-5"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Apply Budget Limit
                      </Button>
                    </div>

                  </div>
                )}
              </Card>
            )}

            {/* TAB 3: TACTICAL defaults */}
            {activeTab === "tactics" && (
              <Card className="bg-card/65 backdrop-blur-md border-border/40 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

                <div className="flex items-center gap-3 mb-6 border-b border-[#1d242e] pb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Tactical Strategy presets</h2>
                    <p className="text-xs text-muted-foreground">Configure global defaults for tactics, lineup structure, and match-engine configurations.</p>
                  </div>
                </div>

                <div className="space-y-6">

                  {/* Formation selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Default Squad Formation</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {VALID_FORMATIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFormation(f)}
                          className={`py-3 px-4 rounded-xl border text-sm font-bold cursor-pointer transition ${formation === f
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-[#181d24] border-[#222b39] text-muted-foreground hover:bg-[#1b222d] hover:text-white"
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Style selection */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-muted-foreground">Club Tactical Philosophy</label>
                    <div className="space-y-2">
                      {PLAY_STYLES.map((style) => {
                        const active = selectedPlaystyle === style.name;
                        return (
                          <button
                            key={style.name}
                            onClick={() => setSelectedPlaystyle(style.name)}
                            className={`w-full p-4 rounded-xl border text-left cursor-pointer transition flex justify-between items-center ${active
                              ? "bg-[#181d24] border-emerald-500 text-white"
                              : "bg-[#13171e] border-[#222b39] text-muted-foreground hover:bg-[#181d24]/60 hover:text-white"
                              }`}
                          >
                            <div>
                              <span className="text-sm font-bold text-white block mb-0.5">{style.name}</span>
                              <span className="text-xs block text-muted-foreground">{style.desc}</span>
                            </div>
                            {active && (
                              <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                                Active
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub sliders (Tempo, Line height) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1d242e]">

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground">Build-Up Tempo</span>
                        <span className="font-bold text-white">{tempoSlider} (High Speed)</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={tempoSlider}
                        onChange={(e) => setTempoSlider(Number(e.target.value))}
                        className="w-full accent-emerald-400 h-1.5 bg-[#12161b] rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Cautious / Slow</span>
                        <span>Fast Passing / Counter</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground">Defensive Line Height</span>
                        <span className="font-bold text-white">{lineHeightSlider} (High Press)</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={lineHeightSlider}
                        onChange={(e) => setLineHeightSlider(Number(e.target.value))}
                        className="w-full accent-emerald-400 h-1.5 bg-[#12161b] rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Low Block / Deep</span>
                        <span>Offside Trap / High Line</span>
                      </div>
                    </div>

                  </div>

                  {/* Submit Action */}
                  <div className="pt-4 border-t border-[#1d242e] flex justify-end">
                    <Button
                      onClick={handleSaveTactics}
                      disabled={saving}
                      className="bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-black flex items-center gap-2 cursor-pointer rounded-xl px-5"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Apply Tactical Defaults
                    </Button>
                  </div>

                </div>
              </Card>
            )}


          </div>

        </div>
      </div>
    </>
  );
}
