"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";

import {
  LayoutDashboard,
  Search,
  Users,
  Eye,
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Home,
} from "lucide-react";

interface SidebarItem {
  label: string;
  href?: string;
  icon: any;
  children?: { label: string; href: string }[];
}

const items: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Scout",
    href: "/scout",
    icon: Search,
    children: [
      { label: "Player Cards", href: "/scout" },
      { label: "Player Plot", href: "/scout/plot" },
    ],
  },
  {
    label: "Squad",
    href: "/squad",
    icon: Users,
  },
  {
    label: "Watchlist",
    href: "/watchlist",
    icon: Eye,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "AI Tactical Assistant",
    href: "/tactics",
    icon: ClipboardList,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Back to Home",
    href: "/",
    icon: Home,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();

  const [scoutExpanded, setScoutExpanded] = useState(false);
  const [showScoutPopover, setShowScoutPopover] = useState(false);

  const { user, logout } = useAuth();
  const [squadName, setSquadName] = useState("ApexFC");
  const [clubEmoji, setClubEmoji] = useState("⚽");
  const [managerName, setManagerName] = useState("Asher");

  const getInitials = (name: string) => {
    if (!name) return "AW";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const fetchClubProfile = async () => {
    if (!user) return;
    try {
      const res = await api.get("/squads/", { params: { user_id: user.id } });
      const activeSquad = res.data?.[0];
      if (activeSquad) {
        setSquadName(activeSquad.squad_name);
      }
      if (typeof window !== "undefined") {
        const storedEmoji = localStorage.getItem("apex_club_emoji");
        if (storedEmoji) {
          setClubEmoji(storedEmoji);
        }
        const storedManager = localStorage.getItem("apex_manager_name");
        if (storedManager) {
          setManagerName(storedManager);
        } else {
          setManagerName(user.username || "Asher");
        }
      }
    } catch (err) {
      console.error("Error loading sidebar club details:", err);
    }
  };

  useEffect(() => {
    fetchClubProfile();
  }, [user]);

  useEffect(() => {
    window.addEventListener("squad-updated", fetchClubProfile);
    return () => window.removeEventListener("squad-updated", fetchClubProfile);
  }, [user]);

  useEffect(() => {
    if (pathname.startsWith("/scout")) {
      setScoutExpanded(true);
    }
  }, [pathname]);

  return (
    <aside className={`relative z-30 border-r border-border/40 bg-card/50 backdrop-blur-md transition-all duration-300 shrink-0 flex flex-col justify-between h-full ${collapsed ? "w-20" : "w-64"}`}>

      <div>
        {/* Sidebar Header Logo & Toggle */}
        <div className={`flex items-center border-b border-border/40 min-h-[64px] ${collapsed ? "flex-col gap-2.5 justify-center py-4" : "justify-between px-5"}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 overflow-hidden max-w-[80%]">
                <img 
                  src="/logo.png" 
                  className="w-6 h-6 rounded-md object-contain shrink-0 border border-border/40" 
                  alt="Club Logo"
                />
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent truncate animate-fade-in" title="ApexFC">
                  ApexFC
                </h1>
              </div>
              <button
                onClick={toggle}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <>
              <img 
                src="/logo.png" 
                className="w-7 h-7 rounded-md object-contain shrink-0 border border-border/40 animate-fade-in" 
                alt="Club Logo"
              />
              <button
                onClick={toggle}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        <nav className="flex flex-col gap-2 p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;

            if (hasChildren) {
              const isSubActive = item.children?.some(child => pathname === child.href);

              if (collapsed) {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setShowScoutPopover(true)}
                    onMouseLeave={() => setShowScoutPopover(false)}
                  >
                    <button
                      onClick={() => {
                        if (item.href) router.push(item.href);
                      }}
                      className={`flex items-center justify-center rounded-xl py-3 transition-all duration-300 mx-auto w-12 cursor-pointer
                      ${isSubActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"}`}
                    >
                      <Icon size={20} className="shrink-0" />
                    </button>

                    {showScoutPopover && (
                      <div className="absolute left-full top-0 pl-2 w-48 z-50">
                        <div className="bg-card/85 backdrop-blur-md border border-border/40 rounded-xl shadow-xl overflow-hidden flex flex-col py-1 text-left">
                          <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground border-b border-border/40 bg-muted/20">
                            {item.label}
                          </div>
                          {item.children?.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`px-4 py-2.5 text-sm font-semibold hover:bg-accent transition-colors ${pathname === child.href ? "text-primary bg-primary/5" : "text-foreground"
                                }`}
                              onClick={() => setShowScoutPopover(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.label} className="flex flex-col w-full">
                  <button
                    onClick={() => {
                      if (item.href) router.push(item.href);
                      setScoutExpanded(!scoutExpanded);
                    }}
                    className={`flex items-center justify-between rounded-xl py-3 px-4 w-full transition-all duration-300 cursor-pointer
                    ${isSubActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent text-foreground"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="shrink-0" />
                      <span className="whitespace-nowrap text-sm font-medium">
                        {item.label}
                      </span>
                    </div>
                    {scoutExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {scoutExpanded && (
                    <div className="mt-1 flex flex-col gap-2 pl-9 border-l border-border/80 ml-6 py-0.5">
                      {item.children?.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors ${childActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                              }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href || "#"}
                className={`flex items-center rounded-xl py-3 transition-all duration-300
                ${collapsed ? "justify-center px-0 mx-auto w-12" : "px-4 gap-3 w-full"}
                ${active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-foreground"
                  }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="shrink-0" />

                {!collapsed && (
                  <span className="whitespace-nowrap transition-opacity duration-300 font-medium text-sm">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button section */}
      <div className="p-4 border-t border-border/60">
        <button
          onClick={() => {
            router.push("/?logout=true");
          }}
          className={`flex items-center rounded-xl py-3 transition-all duration-300 cursor-pointer text-rose-500 hover:bg-rose-500/10 hover:text-rose-400
          ${collapsed ? "justify-center px-0 mx-auto w-12" : "px-4 gap-3 w-full"}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && (
            <span className="whitespace-nowrap transition-opacity duration-300 font-medium text-sm">
              Logout
            </span>
          )}
        </button>
      </div>

    </aside>
  );
}