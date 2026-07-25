"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Gem,
  MessageSquare,
  Activity,
  TrendingUp,
  Coins,
  Users,
  ArrowRight,
  Sparkles,
  LogIn,
  UserPlus,
  ChevronDown,
  BarChart3,
  Eye,
  Sliders,
  Cpu,
  Layers,
  Heart
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import Logo from "@/components/ui/Logo";
import HomepageBackground from "@/components/homepage/HomepageBackground";

export default function Home() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeShortcut, setActiveShortcut] = useState("scout");
  const [navDropdown, setNavDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("logout") === "true") {
        logout();
        router.replace("/");
      }
    }
  }, [logout, router]);

  useEffect(() => {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--primary-foreground");
  }, []);

  const shortcuts = [
    { id: "scout", label: "AI Replacements", icon: Search, desc: "Find replicas using similarity algorithms", path: "/analytics/similar" },
    { id: "gems", label: "Hidden Gems", icon: Gem, desc: "Scan undervalued high-potential talent", path: "/dashboard" },
    { id: "squad", label: "Squad Builder", icon: Users, desc: "Configure rosters and team chemistry", path: "/squad" },
    { id: "tactics", label: "Tactical Boards", icon: MessageSquare, desc: "Plan press triggers and training drills", path: "/tactics" },
    { id: "predictor", label: "Price Predictor", icon: Coins, desc: "Forecast peak player market values", path: "/analytics" },
    { id: "watchlist", label: "Watchlist Targets", icon: Eye, desc: "Monitor prospective transfer developments", path: "/watchlist" }
  ];

  const templates = [
    {
      title: "Midfield General Engine",
      overall: 87,
      age: 24,
      position: "CM, CDM",
      stats: { PAS: "92%", DRI: "88%", DEF: "81%", PHY: "85%" },
      color: "from-emerald-500/20 to-teal-500/10",
      accent: "border-emerald-500/30 text-emerald-400"
    },
    {
      title: "U21 Golden Boot Prospect",
      overall: 79,
      potential: 91,
      position: "ST, CF",
      stats: { PAC: "94", SHO: "87", DRI: "82", PHY: "78" },
      color: "from-purple-500/20 to-indigo-500/10",
      accent: "border-purple-500/30 text-purple-400"
    },
    {
      title: "Positional Play Winger",
      overall: 84,
      age: 22,
      position: "LW, RW",
      stats: { PAC: "91", DRI: "89", PAS: "84", SHO: "78" },
      color: "from-cyan-500/20 to-blue-500/10",
      accent: "border-cyan-500/30 text-cyan-400"
    },
    {
      title: "Ball Playing Defender",
      overall: 85,
      age: 26,
      position: "CB",
      stats: { DEF: "88", PHY: "86", PAS: "80", PAC: "74" },
      color: "from-blue-500/20 to-indigo-500/10",
      accent: "border-blue-500/30 text-blue-400"
    }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (user) {
      router.push(`/scout?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/login?redirect=/scout?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleShortcutClick = (shortcutPath: string) => {
    if (user) {
      router.push(shortcutPath);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(shortcutPath)}`);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      <HomepageBackground />

      {/* Dynamic Background Auras */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-emerald-500/5 via-cyan-500/2.5 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] left-10 w-[500px] h-[500px] bg-purple-500/2.5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] right-10 w-[600px] h-[600px] bg-blue-500/2.5 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Standalone Canva-Style Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40 h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">

          {/* Left: Branding & Categories menu */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group hover:scale-105 transition-transform duration-300">
              <Logo className="w-8 h-8" glow={true} />
              <span className="text-xl font-black tracking-tight text-white">
                ApexFC
              </span>
            </Link>

            {/* Nav Menu */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-400">
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer py-2">
                  AI Scouting
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {/* Popover */}
                <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl p-4 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3.5">
                    <div>
                      <h4 className="text-xs font-black text-primary uppercase">Scouting Matrix</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Statistical KNN similarity searching and replicas scout.</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-purple-400 uppercase">Youth Gem Radar</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Scan database for high-potential youth undervaluation gaps.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer py-2">
                  Tactical Boards
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl p-4 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <h4 className="text-xs font-black text-sky-400 uppercase">AI Tactical Assistant</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Brainstorm game philosophies, transit zones, and drill structures.</p>
                  </div>
                </div>
              </div>

              <a href="#features" className="hover:text-white transition-colors py-2">Features</a>
              <a href="#technology" className="hover:text-white transition-colors py-2">Our Stack</a>
            </div>
          </div>

          {/* Right: Auth triggers */}
          <div className="flex items-center gap-4">
            {!loading && user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Welcome, <span className="text-primary font-bold">{user.username}</span>
                </span>
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition duration-300"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white font-bold text-sm px-3 py-2 transition-colors cursor-pointer"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-primary text-primary-foreground font-black text-sm px-5 py-2.5 rounded-xl hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition duration-300 cursor-pointer"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* Main Bento Grid Container */}
      <main className="max-w-7xl mx-auto w-full px-6 pt-24 pb-16 flex-1 flex flex-col gap-6 relative z-10">

        {/* Row 1: Hero Console (Search + Description) & Quick Shortcuts Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bento Box 1: Hero Scouting Search */}
          <div className="lg:col-span-2 bg-card/45 backdrop-blur-md border border-border/40 rounded-3xl p-8 flex flex-col justify-center space-y-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
              Who will you <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                scout today?
              </span>
            </h1>
            <p className="text-sm text-gray-400 max-w-xl">
              Design your roster, match key stats, and analyze tactical shapes using machine learning algorithms and advanced data streams.
            </p>

            {/* Search Input Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="w-full bg-background/50 border border-border/60 rounded-2xl p-2.5 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition duration-300 flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for players, ratings, squads..."
                className="flex-1 bg-transparent text-white placeholder:text-gray-500 font-medium text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-xs px-5 py-3 rounded-xl hover:opacity-95 transition cursor-pointer"
              >
                Analyze
              </button>
            </form>

            {/* Quick Suggestions */}
            <p className="text-xs text-gray-500 font-medium">
              Try searching:{" "}
              <button onClick={() => setSearchQuery("Lionel Messi")} className="text-gray-400 hover:text-primary transition font-semibold">Lionel Messi</button>,{" "}
              <button onClick={() => setSearchQuery("Jude Bellingham")} className="text-gray-400 hover:text-primary transition font-semibold">Jude Bellingham</button>,{" "}
              <button onClick={() => setSearchQuery("Erling Haaland")} className="text-gray-400 hover:text-primary transition font-semibold">Erling Haaland</button>
            </p>
          </div>

          {/* Bento Box 2: Quick Console Shortcuts */}
          <div className="bg-card/45 backdrop-blur-md border border-border/40 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-1">
                Quick Console Access
              </h3>
              <p className="text-[11px] text-gray-400">
                Direct entry points into modeling algorithms and squads.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon;
                const isActive = activeShortcut === shortcut.id;

                return (
                  <button
                    key={shortcut.id}
                    onMouseEnter={() => setActiveShortcut(shortcut.id)}
                    onClick={() => handleShortcutClick(shortcut.path)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer group ${isActive
                        ? "bg-secondary border-primary/40 shadow-sm"
                        : "bg-background/30 border-border/40 hover:border-border/80 hover:bg-secondary/20"
                      }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${isActive ? "text-primary" : "text-gray-400 group-hover:text-white"}`} />
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive ? "text-primary" : "text-gray-400 group-hover:text-white"}`}>
                      {shortcut.id}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-6 text-center">
              {shortcuts.map((s) => s.id === activeShortcut && (
                <p key={s.id} className="text-[11px] text-muted-foreground italic">
                  {s.desc}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Scouting Showcase Templates */}
        <div className="bg-card/45 backdrop-blur-md border border-border/40 rounded-3xl p-8 space-y-6 hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/40 pb-5">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary">
                Template Canvas Scouting Profiles
              </h3>
              <h2 className="text-2xl font-black text-white mt-1 uppercase">
                Explore Scouting Layouts
              </h2>
            </div>
            <button
              onClick={() => handleShortcutClick("/scout")}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              See all templates
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${template.color} border border-border/40 rounded-2xl p-5 hover:border-border transition-all duration-300 flex flex-col justify-between h-64 group relative overflow-hidden`}
              >
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-black uppercase tracking-widest bg-white/5 border px-2 py-0.5 rounded ${template.accent}`}>
                      {template.position}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase">Type: Card</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-white group-hover:text-primary transition duration-200 leading-snug">
                    {template.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {Object.entries(template.stats).map(([stat, val]) => (
                      <div key={stat} className="bg-background/40 rounded-lg p-2 text-center border border-border/40">
                        <span className="text-[9px] text-gray-500 font-bold block leading-none">{stat}</span>
                        <span className="text-xs font-extrabold text-white mt-1 block">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <div>
                    <span className="text-[9px] text-gray-500 block leading-none">Overall Score</span>
                    <span className="text-base font-black text-white">{template.overall}</span>
                  </div>
                  {template.potential && (
                    <div className="text-right">
                      <span className="text-[9px] text-emerald-400 block leading-none">Potential</span>
                      <span className="text-base font-black text-emerald-400">{template.potential}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Why ApexFC Feature Details & FastAPI Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Why ApexFC */}
          <div id="features" className="lg:col-span-2 bg-card/45 backdrop-blur-md border border-border/40 rounded-3xl p-8 space-y-6 hover:border-emerald-500/20 transition-all duration-300">
            <span className="inline-block text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Why ApexFC?
            </span>
            <h2 className="text-3xl font-black text-white uppercase leading-tight">
              Design the future of <br />
              your football franchise.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              ApexFC empowers football scouts and club managers to organize rosters using clean visual chemistry metrics, similarity calculators, and AI assistance. Replace speculative guesswork with predictive algorithms.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Full Attribute Filters</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Sort and search through over 15,000 player data records using detailed sliders for pace, physical attributes, value tags, and contract years.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Linear/KNN Similarity Vectors</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Search through multi-attribute spatial clusters to locate replacement targets holding duplicate statistical outputs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Spec */}
          <div id="technology" className="bg-card/45 backdrop-blur-md border border-border/40 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Engine Architecture Spec</h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-gray-400">ML Valuation Core</span>
                  <span className="font-bold text-white">Random Forest (R² = 94.28%)</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-gray-400">Backend Middleware</span>
                  <span className="font-bold text-white">FastAPI Core System</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-gray-400">Interface Stack</span>
                  <span className="font-bold text-white">Next.js 16 & Framer Motion</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-400">Average Pipeline Speed</span>
                  <span className="font-bold text-emerald-400">0.2s search completion</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Row 4: Call to Action Banner */}
        <div className="bg-card/45 backdrop-blur-md border border-border/40 rounded-3xl p-10 text-center relative overflow-hidden hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent)] pointer-events-none" />

          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase leading-none">
              Ready to design your <br />
              championship roster?
            </h2>
            <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
              Create your account today to build squads, configure active positions, track value forecasts, and query tactical advisors.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              {!loading && user ? (
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-base px-8 py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Go to Workspace Console
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="bg-primary text-primary-foreground font-black text-base px-8 py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Sign Up Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-bold text-base px-8 py-4 rounded-2xl transition duration-300 flex items-center justify-center cursor-pointer"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Standalone Canva-Style Multi-Column Footer */}
      <footer className="bg-card/40 backdrop-blur-md border-t border-border/60 py-16 px-6 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">

          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" glow={false} />
              <span className="font-extrabold text-sm text-white">ApexFC Analytics</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
              Advanced artificial intelligence platform for professional football operations and scout recruitment.
            </p>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Scouting Tools</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><button onClick={() => handleShortcutClick("/analytics/similar")} className="hover:text-white transition">AI Replacements</button></li>
              <li><button onClick={() => handleShortcutClick("/dashboard")} className="hover:text-white transition">Hidden Gems</button></li>
              <li><button onClick={() => handleShortcutClick("/scout")} className="hover:text-white transition">Player Cards</button></li>
              <li><button onClick={() => handleShortcutClick("/scout/plot")} className="hover:text-white transition">Scouting Plots</button></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Coaching Stack</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><button onClick={() => handleShortcutClick("/squad")} className="hover:text-white transition">Squad Roster Builder</button></li>
              <li><button onClick={() => handleShortcutClick("/tactics")} className="hover:text-white transition">AI Tactical Board</button></li>
              <li><button onClick={() => handleShortcutClick("/watchlist")} className="hover:text-white transition">Watchlist Targets</button></li>
              <li><button onClick={() => handleShortcutClick("/settings")} className="hover:text-white transition">Club Settings</button></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Pricing & Legal</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#" className="hover:text-white transition">Pro Club Plans</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Support Desk</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-border/40 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} ApexFC. All rights reserved. Built with advanced regression modeling.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Football Managers
          </p>
        </div>
      </footer>
    </div>
  );
}
