"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEFAULT_AVATAR } from "@/lib/utils";
import { calculateAdvancedChemistry } from "@/lib/chemistry";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Settings, 
  HelpCircle, 
  Search, 
  Plus, 
  Trash2, 
  Star, 
  TrendingUp, 
  ArrowLeftRight, 
  Loader2,
  Bookmark,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  TrendingDown,
  ClipboardList,
  Download,
  ChevronLeft,
  ChevronRight,
  Sliders
} from "lucide-react";

// Position Slot interfaces
interface PitchSlot {
  label: string;
  top: string;
  left: string;
}

// 7 VALID FORMATIONS mapping index 0-10 to top/left percent on football pitch
const FORMATION_SLOTS: Record<string, PitchSlot[]> = {
  "4-4-2": [
    { label: "GK", top: "86%", left: "50%" },
    { label: "LB", top: "67%", left: "15%" },
    { label: "LCB", top: "70%", left: "37%" },
    { label: "RCB", top: "70%", left: "63%" },
    { label: "RB", top: "67%", left: "85%" },
    { label: "LM", top: "45%", left: "15%" },
    { label: "LCM", top: "48%", left: "37%" },
    { label: "RCM", top: "48%", left: "63%" },
    { label: "RM", top: "45%", left: "85%" },
    { label: "LS", top: "20%", left: "32%" },
    { label: "RS", top: "20%", left: "68%" }
  ],
  "4-3-3": [
    { label: "GK", top: "86%", left: "50%" },
    { label: "LB", top: "67%", left: "15%" },
    { label: "LCB", top: "70%", left: "37%" },
    { label: "RCB", top: "70%", left: "63%" },
    { label: "RB", top: "67%", left: "85%" },
    { label: "LCM", top: "46%", left: "28%" },
    { label: "CDM", top: "52%", left: "50%" },
    { label: "RCM", top: "46%", left: "72%" },
    { label: "LW", top: "22%", left: "18%" },
    { label: "ST", top: "18%", left: "50%" },
    { label: "RW", top: "22%", left: "82%" }
  ],
  "3-5-2": [
    { label: "GK", top: "86%", left: "50%" },
    { label: "LCB", top: "70%", left: "28%" },
    { label: "CB", top: "72%", left: "50%" },
    { label: "RCB", top: "70%", left: "72%" },
    { label: "LWB", top: "50%", left: "12%" },
    { label: "RWB", top: "50%", left: "88%" },
    { label: "LCM", top: "46%", left: "33%" },
    { label: "CDM", top: "53%", left: "50%" },
    { label: "RCM", top: "46%", left: "67%" },
    { label: "LS", top: "20%", left: "32%" },
    { label: "RS", top: "20%", left: "68%" }
  ],
  "3-4-3": [
    { label: "GK", top: "86%", left: "50%" },
    { label: "LCB", top: "70%", left: "28%" },
    { label: "CB", top: "72%", left: "50%" },
    { label: "RCB", top: "70%", left: "72%" },
    { label: "LM", top: "48%", left: "15%" },
    { label: "LCM", top: "50%", left: "37%" },
    { label: "RCM", top: "50%", left: "63%" },
    { label: "RM", top: "48%", left: "85%" },
    { label: "LW", top: "22%", left: "20%" },
    { label: "ST", top: "17%", left: "50%" },
    { label: "RW", top: "22%", left: "80%" }
  ],
  "4-2-3-1": [
    { label: "GK", top: "86%", left: "50%" },
    { label: "LB", top: "67%", left: "15%" },
    { label: "LCB", top: "70%", left: "37%" },
    { label: "RCB", top: "70%", left: "63%" },
    { label: "RB", top: "67%", left: "85%" },
    { label: "LDM", top: "53%", left: "34%" },
    { label: "RDM", top: "53%", left: "66%" },
    { label: "LAM", top: "34%", left: "20%" },
    { label: "CAM", top: "32%", left: "50%" },
    { label: "RAM", top: "34%", left: "80%" },
    { label: "ST", top: "17%", left: "50%" }
  ],
  "5-3-2": [
    { label: "GK", top: "86%", left: "50%" },
    { label: "LWB", top: "65%", left: "12%" },
    { label: "LCB", top: "70%", left: "32%" },
    { label: "CB", top: "71%", left: "50%" },
    { label: "RCB", top: "70%", left: "68%" },
    { label: "RWB", top: "65%", left: "88%" },
    { label: "LCM", top: "46%", left: "28%" },
    { label: "CM", top: "49%", left: "50%" },
    { label: "RCM", top: "46%", left: "72%" },
    { label: "LS", top: "20%", left: "32%" },
    { label: "RS", top: "20%", left: "68%" }
  ],
  "5-4-1": [
    { label: "GK", top: "86%", left: "50%" },
    { label: "LWB", top: "65%", left: "12%" },
    { label: "LCB", top: "70%", left: "32%" },
    { label: "CB", top: "71%", left: "50%" },
    { label: "RCB", top: "70%", left: "68%" },
    { label: "RWB", top: "65%", left: "88%" },
    { label: "LM", top: "45%", left: "18%" },
    { label: "LCM", top: "48%", left: "38%" },
    { label: "RCM", top: "48%", left: "62%" },
    { label: "RM", top: "45%", left: "82%" },
    { label: "ST", top: "18%", left: "50%" }
  ]
};

interface SquadPlayer {
  id: number;
  squad_id: number;
  player_id: number;
  position: string; // Stored as slot index string "0"-"10"
  purchase_price: number;
  current_value: number;
  points: number;
  joined_at: string;
}

interface PlayerProfile {
  id: number;
  name: string;
  photo: string;
  nationality: string;
  nationalityFlag: string;
  club: string;
  clubLogo: string;
  position: string;
  league: string;
  age: number;
  foot: string;
  overall: number;
  potential: number;
  marketValue: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physic: number;
}

interface SquadData {
  id: number;
  user_id: number;
  squad_name: string;
  formation: string;
  budget: number;
  squad_value: number;
  total_points: number;
  captain_id: number | null;
  vice_captain_id: number | null;
  players: SquadPlayer[];
}

export default function SquadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Active Squad States
  const [squad, setSquad] = useState<SquadData | null>(null);
  const [playerDetails, setPlayerDetails] = useState<Record<number, PlayerProfile>>({});
  const [loading, setLoading] = useState(true);

  // Filters State
  const [formation, setFormation] = useState("4-4-2");
  const [playersPerPos, setPlayersPerPos] = useState(1);
  const [playstyle, setPlaystyle] = useState("Gegenpressing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Roster Stars (favorites) state
  const [starredPlayers, setStarredPlayers] = useState<Record<number, boolean>>({});

  // Drag & drop state for squad re-positioning
  const [draggedPlayer, setDraggedPlayer] = useState<{ slotIndex: number; subIndex: number; playerId: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Search assignment modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [activeSlotSubIndex, setActiveSlotSubIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Initialize or fetch squad
  const fetchOrCreateSquad = async (userId: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // 1. Get user squads
      const listRes = await api.get("/squads/", { params: { user_id: userId } });
      let activeSquad = listRes.data?.[0];

      // 2. If no squad exists, create a default squad
      if (!activeSquad) {
        const createRes = await api.post(`/squads/?user_id=${userId}`, {
          squad_name: "First Team",
          formation: "4-4-2"
        });
        activeSquad = createRes.data;
      }

      // 3. Load full squad details
      const detailRes = await api.get(`/squads/${activeSquad.id}`);
      setSquad(detailRes.data);
      setFormation(detailRes.data.formation || "4-4-2");

      // 4. Fetch profiles in parallel
      const players = detailRes.data.players || [];
      const profiles: Record<number, PlayerProfile> = {};
      await Promise.all(
        players.map(async (p: SquadPlayer) => {
          try {
            const res = await api.get(`/players/${p.player_id}`);
            const backend = res.data;
            profiles[p.player_id] = {
              id: backend.fifa_id,
              name: backend.name,
              photo: backend.face_url || backend.photo || "",
              nationality: backend.nationality || "",
              nationalityFlag: backend.nation_flag || backend.nationalityFlag || "",
              club: backend.club || "",
              clubLogo: backend.club_logo || backend.clubLogo || "",
              position: backend.position || "",
              league: backend.league || "",
              age: backend.age || 0,
              foot: backend.preferred_foot || backend.foot || "",
              overall: backend.overall || 0,
              potential: backend.potential || 0,
              marketValue: backend.value_eur || backend.marketValue || 0,
              pace: backend.pace || 0,
              shooting: backend.shooting || 0,
              passing: backend.passing || 0,
              dribbling: backend.dribbling || 0,
              defending: backend.defending || 0,
              physic: backend.physical || backend.physic || 0,
            };
          } catch (err) {
            console.error("Error loading profile:", p.player_id, err);
          }
        })
      );
      setPlayerDetails(prev => ({ ...prev, ...profiles }));
    } catch (err) {
      console.error("Error fetching squad details:", err);
      toast.error("Failed to load squad details.");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrCreateSquad(user.id, true);
      if (typeof window !== "undefined") {
        const storedPlaystyle = localStorage.getItem("apex_playstyle");
        if (storedPlaystyle) {
          setPlaystyle(storedPlaystyle);
        }
      }
      const handleSquadUpdate = () => {
        fetchOrCreateSquad(user.id, false);
      };
      window.addEventListener("squad-updated", handleSquadUpdate);
      return () => {
        window.removeEventListener("squad-updated", handleSquadUpdate);
      };
    }
  }, [user]);

  // Handle formation change
  const handleFormationChange = async (newForm: string) => {
    if (!squad) return;
    setFormation(newForm);
    try {
      const res = await api.patch(`/squads/${squad.id}/formation`, { formation: newForm });
      setSquad(prev => prev ? { ...prev, formation: newForm } : null);
      toast.success(`Formation updated to ${newForm}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update formation on server.");
    }
  };

  // Handle tactical philosophy change
  const handlePlaystyleChange = (newPlaystyle: string) => {
    setPlaystyle(newPlaystyle);
    if (typeof window !== "undefined") {
      localStorage.setItem("apex_playstyle", newPlaystyle);
    }
    window.dispatchEvent(new Event("squad-updated"));
    toast.success(`Tactical Philosophy set to ${newPlaystyle}`);
  };

  // Open search modal to assign player
  const openSearchForSlot = (index: number, subIndex: number) => {
    setActiveSlotIndex(index);
    setActiveSlotSubIndex(subIndex);
    setSearchQuery("");
    setSearchResults([]);
    setSearchModalOpen(true);
  };

  // Execute search
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearchLoading(true);
    try {
      const res = await api.get("/players/", { params: { search: searchQuery, page_size: 15 } });
      setSearchResults(res.data.players || []);
    } catch (err) {
      console.error("Error searching players:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Assign player to slot
  const assignPlayerToSlot = async (player: any) => {
    if (!squad || activeSlotIndex === null || activeSlotSubIndex === null) return;
    try {
      // 1. Remove any player currently occupying this slot_subIndex position
      const targetPosString = `${activeSlotIndex}_${activeSlotSubIndex}`;
      const existingInSlot = squad.players.find(p => {
        if (p.position === String(activeSlotIndex) && activeSlotSubIndex === 0) return true;
        return p.position === targetPosString;
      });
      if (existingInSlot) {
        await api.delete(`/squads/${squad.id}/players/${existingInSlot.player_id}`);
      }

      // 2. Add player to squad
      await api.post(`/squads/${squad.id}/players`, {
        player_id: player.fifa_id,
        position: targetPosString
      });

      // 3. Clear modal and refresh squad in background
      setSearchModalOpen(false);
      await fetchOrCreateSquad(user!.id, false);
      window.dispatchEvent(new Event("squad-updated"));
      toast.success(`${player.name} added to squad!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to add player. Check budget (€100M max) or duplicates.");
    }
  };

  // Remove player from squad
  const removePlayerFromSlot = async (playerId: number, name: string) => {
    if (!squad) return;
    try {
      await api.delete(`/squads/${squad.id}/players/${playerId}`);
      await fetchOrCreateSquad(user!.id, false);
      window.dispatchEvent(new Event("squad-updated"));
      toast.success(`${name} removed from lineup.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove player from squad.");
    }
  };

  // Clear all players from squad
  const handleClearSquad = async () => {
    if (!squad) return;
    const confirm = window.confirm("Are you sure you want to remove all players from the squad roster? This will refund their valuations to your available budget.");
    if (!confirm) return;

    try {
      await api.delete(`/squads/${squad.id}/players`);
      await fetchOrCreateSquad(user!.id, false);
      window.dispatchEvent(new Event("squad-updated"));
      toast.success("Squad roster cleared successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to clear squad roster.");
    }
  };

  // Toggle star/bookmark inside roster
  const toggleStarred = (playerId: number) => {
    setStarredPlayers(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  // Swap Sub player with Starter player in the same slot index
  const swapStarterAndSub = async (slotIndex: number, subIndex: number) => {
    if (!squad) return;
    
    const starterSp = findSquadPlayer(slotIndex, 0);
    const subSp = findSquadPlayer(slotIndex, subIndex);
    
    if (!subSp) return;

    try {
      if (starterSp) {
        // Swap Starter and Sub in SQLite database
        await api.delete(`/squads/${squad.id}/players/${starterSp.player_id}`);
        await api.delete(`/squads/${squad.id}/players/${subSp.player_id}`);

        await api.post(`/squads/${squad.id}/players`, {
          player_id: subSp.player_id,
          position: `${slotIndex}_0`
        });

        await api.post(`/squads/${squad.id}/players`, {
          player_id: starterSp.player_id,
          position: `${slotIndex}_${subIndex}`
        });

        const subProfile = playerDetails[subSp.player_id];
        const starterProfile = playerDetails[starterSp.player_id];
        toast.success(`Swapped: ${subProfile?.name || "Player"} is now starting over ${starterProfile?.name || "Player"}`);
      } else {
        // Promote Sub to Starter
        await api.delete(`/squads/${squad.id}/players/${subSp.player_id}`);
        await api.post(`/squads/${squad.id}/players`, {
          player_id: subSp.player_id,
          position: `${slotIndex}_0`
        });
        const subProfile = playerDetails[subSp.player_id];
        toast.success(`Promoted ${subProfile?.name || "Player"} to Starter!`);
      }

      await fetchOrCreateSquad(user!.id, false);
      window.dispatchEvent(new Event("squad-updated"));
    } catch (err: any) {
      console.error("Error swapping players:", err);
      toast.error("Failed to swap players.");
      fetchOrCreateSquad(user!.id, false);
    }
  };

  // Drag and Drop: Swap player positions across any slot indices
  const handleSwapSlots = async (
    sourceSlotIndex: number, 
    sourceSubIndex: number, 
    targetSlotIndex: number, 
    targetSubIndex: number
  ) => {
    if (!squad) return;
    if (sourceSlotIndex === targetSlotIndex && sourceSubIndex === targetSubIndex) return;

    const sourceSp = findSquadPlayer(sourceSlotIndex, sourceSubIndex);
    const targetSp = findSquadPlayer(targetSlotIndex, targetSubIndex);

    if (!sourceSp) return;

    try {
      const sourcePosStr = `${sourceSlotIndex}_${sourceSubIndex}`;
      const targetPosStr = `${targetSlotIndex}_${targetSubIndex}`;

      if (targetSp) {
        // Swap positions of source and target players in SQLite database
        await api.delete(`/squads/${squad.id}/players/${sourceSp.player_id}`);
        await api.delete(`/squads/${squad.id}/players/${targetSp.player_id}`);

        await api.post(`/squads/${squad.id}/players`, {
          player_id: sourceSp.player_id,
          position: targetPosStr
        });
        await api.post(`/squads/${squad.id}/players`, {
          player_id: targetSp.player_id,
          position: sourcePosStr
        });

        const sourceName = playerDetails[sourceSp.player_id]?.name || "Player";
        const targetName = playerDetails[targetSp.player_id]?.name || "Player";
        const targetSlotLabel = FORMATION_SLOTS[formation]?.[targetSlotIndex]?.label || `Pos ${targetSlotIndex + 1}`;
        toast.success(`Swapped ${sourceName} into ${targetSlotLabel} with ${targetName}!`);
      } else {
        // Move source player to empty target position
        await api.delete(`/squads/${squad.id}/players/${sourceSp.player_id}`);
        await api.post(`/squads/${squad.id}/players`, {
          player_id: sourceSp.player_id,
          position: targetPosStr
        });
        const sourceName = playerDetails[sourceSp.player_id]?.name || "Player";
        const targetSlotLabel = FORMATION_SLOTS[formation]?.[targetSlotIndex]?.label || `Pos ${targetSlotIndex + 1}`;
        toast.success(`Moved ${sourceName} to ${targetSlotLabel}!`);
      }

      await fetchOrCreateSquad(user!.id, false);
      window.dispatchEvent(new Event("squad-updated"));
    } catch (err: any) {
      console.error("Error swapping players:", err);
      toast.error("Failed to swap player positions.");
      fetchOrCreateSquad(user!.id, false);
    }
  };

  // Export current squad roster data to a CSV download
  const exportSquadToCSV = () => {
    if (!squad || Object.keys(playerDetails).length === 0) {
      toast.error("No squad data to export.");
      return;
    }

    const headers = ["Position", "Player Name", "Club", "Nationality", "Age", "Rating", "Potential", "Value", "Preferred Foot"];
    const rows = [];

    for (let index = 0; index < 11; index++) {
      const slotLabel = FORMATION_SLOTS[formation]?.[index]?.label || `Pos ${index + 1}`;
      const subIdx = 0;
      const assignedSp = findSquadPlayer(index, subIdx);
      const profile = assignedSp ? playerDetails[assignedSp.player_id] : null;
      
      if (profile) {
        rows.push([
          `"${slotLabel}"`,
          `"${profile.name}"`,
          `"${profile.club || 'N/A'}"`,
          `"${profile.nationality || 'N/A'}"`,
          profile.age,
          profile.overall,
          profile.potential,
          `"€${(profile.marketValue / 1000000).toFixed(1)}M"`,
          `"${profile.foot || 'Right'}"`
        ]);
      } else {
        rows.push([
          `"${slotLabel}"`,
          `"Unassigned"`,
          `""`,
          `""`,
          `""`,
          `""`,
          `""`,
          `""`,
          `""`
        ]);
      }
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${squad.squad_name || "scouting_squad"}_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Squad roster exported as CSV!");
  };

  // Helper to find a squad player assigned to a specific slot and subIndex
  const findSquadPlayer = (slotIndex: number, subIndex: number) => {
    if (!squad) return null;
    return squad.players.find(p => {
      // Backward compatibility: position "0" implies "0_0"
      if (p.position === String(slotIndex) && subIndex === 0) {
        return true;
      }
      return p.position === `${slotIndex}_${subIndex}`;
    });
  };

  // Calculations derived dynamically from current squad player profiles
  const activeLineupProfiles = squad?.players
    .map(p => playerDetails[p.player_id])
    .filter(Boolean) || [];

  const squadCount = activeLineupProfiles.length;
  
  const avgRating = squadCount > 0 
    ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + p.overall, 0) / squadCount) 
    : 0;

  const totalValue = activeLineupProfiles.reduce((acc, p) => acc + (p.marketValue || 0), 0);

  const avgAge = squadCount > 0
    ? (activeLineupProfiles.reduce((acc, p) => acc + p.age, 0) / squadCount).toFixed(1)
    : "0.0";

  const avgPotential = squadCount > 0
    ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + p.potential, 0) / squadCount)
    : 0;

  // A helper function to filter for starter profiles (position index 0-10 or suffix _0)
  const activeStarterProfiles = squad?.players
    .filter(p => p.position.indexOf("_") === -1 || p.position.endsWith("_0"))
    .map(p => playerDetails[p.player_id])
    .filter(Boolean) || [];

  const starterCount = activeStarterProfiles.length;

  // Advanced Multi-Vector Chemistry Score (Passing 25%, Movement 20%, Tactical 20%, Familiarity 15%, Defensive 10%, Attacking 10%)
  const chemistryBreakdown = calculateAdvancedChemistry(activeStarterProfiles);
  const chemistryScore = chemistryBreakdown.overallScore;
  const sharedTags = chemistryBreakdown.sharedTags;

  // Squad Attributes averages for Radar Graph mapping
  const avgPace = squadCount > 0 ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + (p.pace || 0), 0) / squadCount) : 0;
  const avgShooting = squadCount > 0 ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + (p.shooting || 0), 0) / squadCount) : 0;
  const avgPassing = squadCount > 0 ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + (p.passing || 0), 0) / squadCount) : 0;
  const avgDribbling = squadCount > 0 ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + (p.dribbling || 0), 0) / squadCount) : 0;
  const avgDefending = squadCount > 0 ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + (p.defending || 0), 0) / squadCount) : 0;
  const avgPhysic = squadCount > 0 ? Math.round(activeLineupProfiles.reduce((acc, p) => acc + (p.physic || 0), 0) / squadCount) : 0;

  // Radar SVG Math vertices
  // Pace=0, Shooting=1, Passing=2, Dribbling=3, Defending=4, Physicality=5
  const radarLabels = ["Pace", "Shooting", "Passing", "Dribbling", "Defending", "Physicality"];
  const radarStats = [avgPace, avgShooting, avgPassing, avgDribbling, avgDefending, avgPhysic];
  
  const getRadarPointsStr = () => {
    const radiusMax = 80;
    const center = 100;
    const pts = radarStats.map((stat, idx) => {
      const angle = (idx * 60 - 90) * (Math.PI / 180);
      const dist = (stat / 100) * radiusMax;
      const x = center + dist * Math.cos(angle);
      const y = center + dist * Math.sin(angle);
      return `${x},${y}`;
    });
    return pts.join(" ");
  };

  // Position Groups Distribution calculations for bar chart
  let fwdCount = 0;
  let midCount = 0;
  let defCount = 0;
  let gkCount = 0;

  squad?.players.forEach(p => {
    const profile = playerDetails[p.player_id];
    if (profile) {
      const pos = profile.position?.split(",")[0].trim().toUpperCase() || "";
      if (pos === "GK") gkCount++;
      else if (["ST", "CF", "LW", "RW"].includes(pos)) fwdCount++;
      else if (["CM", "CDM", "CAM", "LM", "RM"].includes(pos)) midCount++;
      else defCount++;
    }
  });

  const maxPosCount = Math.max(1, fwdCount, midCount, defCount, gkCount);

  // Helper formatting for currency
  const formatValue = (val: number) => {
    if (!val) return "€0.0";
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  if (authLoading || (user && loading && !squad)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h2 className="text-xl font-bold">Squad Hub</h2>
        <p className="text-muted-foreground text-sm max-w-sm">Please log in to manage your active squad and design team tactical lineups.</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <>
      {/* Full-screen background image behind sidebar and header */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: "url('/images/squad/squad-1.jpg')" }}
      />
      {/* Dark overlay for contrast and readability */}
      <div className="fixed inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none z-0" />

      <div className="flex-1 flex flex-col xl:flex-row h-full overflow-hidden relative z-10 bg-transparent w-full">
        {/* 1. LEFT SIDEBAR: VERTICAL FILTER CONTROL PANEL */}
        <aside className={`transition-all duration-300 ${sidebarCollapsed ? "w-0 p-0 border-r-0 border-b-0 overflow-hidden" : "w-full xl:w-80 border-b xl:border-b-0 xl:border-r border-border/40 p-5"} bg-card/75 backdrop-blur-md shrink-0 flex flex-col space-y-6 overflow-y-auto`}>
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="text-primary h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Tactics & Filters</h2>
          </div>
          <button 
            onClick={() => setSidebarCollapsed(true)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Collapse Panel"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Formation Picker */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Formation Layout</label>
          <select
            value={formation}
            onChange={(e) => handleFormationChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-semibold outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          >
            {Object.keys(FORMATION_SLOTS).map(form => (
              <option key={form} value={form}>{form}</option>
            ))}
          </select>
        </div>

        {/* Tactical Philosophy Picker */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tactical Philosophy</label>
          <select
            value={playstyle}
            onChange={(e) => handlePlaystyleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-semibold outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          >
            {["Gegenpressing", "Tiki-Taka", "Direct Counter", "Wing Play", "Catenaccio"].map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>



        {/* Players per Position Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Players Per Position</label>
          <div className="flex bg-muted/30 p-1 rounded-lg border border-border/40">
            {[1, 2, 3].map((val) => (
              <button
                key={val}
                onClick={() => setPlayersPerPos(val)}
                className={`flex-1 py-1 text-xs font-extrabold rounded-md cursor-pointer transition-all ${
                  playersPerPos === val 
                    ? "bg-background shadow-sm border border-border/50 text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>



      </aside>

      {/* 2. MAIN CENTER CONTAINER: SCROLLABLE DASHBOARD GRID & Lineups */}
      <main className="flex-grow flex flex-col overflow-y-auto p-6 space-y-6">
        
        {/* ROW 1: SECTION (SQUAD OVERVIEW) */}
        <section className="space-y-3">
          <div className="border-b border-border/60 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="mr-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card hover:bg-accent text-primary hover:text-foreground cursor-pointer text-xs font-bold transition-all border border-border shadow-sm"
                  title="Expand Tactics Sidebar"
                >
                  <Sliders size={12} />
                  <span>Tactics</span>
                  <ChevronRight size={10} />
                </button>
              )}
              <Layers className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Squad Overview</h3>
            </div>
            {squad && squad.players && squad.players.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearSquad}
                disabled={loading}
                className="h-8 text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-lg bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Roster
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Overview Stats banner */}
            <Card className="lg:col-span-2 p-5 border border-border/40 bg-card/60 backdrop-blur-md grid grid-cols-5 gap-3.5 items-center text-center">
              <div>
                <span className="text-[22px] font-black tracking-tight text-foreground">{avgRating}</span>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase mt-0.5">Avg Rating</span>
              </div>
              <div>
                <span className="text-[22px] font-black tracking-tight text-foreground">{formatValue(totalValue)}</span>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase mt-0.5">Squad Value</span>
              </div>
              <div>
                <span className="text-[22px] font-black tracking-tight text-foreground">{avgAge}</span>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase mt-0.5">Avg Age</span>
              </div>
              <div>
                <span className="text-[22px] font-black tracking-tight text-foreground">{avgPotential}</span>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase mt-0.5">Avg Potential</span>
              </div>
              <div>
                <span className="text-[22px] font-black tracking-tight text-primary">{starterCount}/11</span>
                <span className="text-[10px] font-bold text-muted-foreground block uppercase mt-0.5">Lineup</span>
              </div>
            </Card>

            {/* Team Chemistry box */}
            <Card className="p-5 border border-border/40 bg-card/60 backdrop-blur-md flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider">Tactical Chemistry</span>
                  <span className="font-black text-primary text-base">{chemistryScore} / 100</span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden border border-border/40">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${chemistryScore}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold italic">
                  {chemistryBreakdown.statusMessage}
                </p>
              </div>

              {/* 7 Component Breakdown Bars */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-border/40 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Passing Network (20%)</span>
                  <span className="font-extrabold text-foreground">{chemistryBreakdown.passingSynergy}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Positional Fit (20%)</span>
                  <span className="font-extrabold text-foreground">{chemistryBreakdown.positionalFit}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Tactical Sync (20%)</span>
                  <span className="font-extrabold text-foreground">{chemistryBreakdown.tacticalSync}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Familiarity (15%)</span>
                  <span className="font-extrabold text-foreground">{chemistryBreakdown.familiarity}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Defensive Cohesion (10%)</span>
                  <span className="font-extrabold text-foreground">{chemistryBreakdown.defensiveCoord}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Attacking Cohesion (10%)</span>
                  <span className="font-extrabold text-foreground">{chemistryBreakdown.attackingCoord}%</span>
                </div>
                <div className="flex justify-between items-center col-span-2 border-t border-border/20 pt-1 mt-0.5">
                  <span className="text-muted-foreground font-medium">Leadership & Experience (5%)</span>
                  <span className="font-extrabold text-primary">{chemistryBreakdown.leadership}%</span>
                </div>
              </div>

              {/* Shared Background Synergy Tags */}
              {sharedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 pt-1.5 border-t border-border/30">
                  {sharedTags.map((tag) => (
                    <span 
                      key={tag}
                      className="text-[9px] font-bold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>

          </div>
        </section>

        {/* ROW 2: SECTION (TACTICAL ANALYSIS: RADAR GRAPH & BAR CHART) */}
        <section className="space-y-3">
          <div className="border-b border-border/60 pb-2 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Squad Attributes Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SVG Radar Chart */}
            <Card className="p-5 border border-border/40 bg-card/60 backdrop-blur-md flex flex-col items-center justify-center min-h-[250px]">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Squad Attributes Radar</h4>
              
              {squadCount === 0 ? (
                <p className="text-xs text-muted-foreground italic py-16">Assign players to view squad attributes radar.</p>
              ) : (
                <div className="w-full max-w-[200px] h-[200px] relative select-none">
                  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                    {/* Concentric grid circles */}
                    {[20, 40, 60, 80].map((r) => (
                      <circle
                        key={r}
                        cx="100"
                        cy="100"
                        r={r}
                        fill="none"
                        stroke="currentColor"
                        className="text-border/40"
                        strokeDasharray={r === 80 ? "none" : "3,3"}
                      />
                    ))}

                    {/* Outer grid axes */}
                    {radarLabels.map((_, idx) => {
                      const angle = (idx * 60 - 90) * (Math.PI / 180);
                      return (
                        <line
                          key={idx}
                          x1="100"
                          y1="100"
                          x2={100 + 80 * Math.cos(angle)}
                          y2={100 + 80 * Math.sin(angle)}
                          stroke="currentColor"
                          className="text-border/40"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Stats Polygon Shape */}
                    <polygon
                      points={getRadarPointsStr()}
                      fill="var(--primary)"
                      fillOpacity="0.2"
                      stroke="var(--primary)"
                      strokeWidth="2"
                    />

                    {/* Outer Label Labels */}
                    {radarLabels.map((lbl, idx) => {
                      const angle = (idx * 60 - 90) * (Math.PI / 180);
                      const x = 100 + 95 * Math.cos(angle);
                      const y = 100 + 95 * Math.sin(angle);
                      return (
                        <text
                          key={lbl}
                          x={x}
                          y={y + 3}
                          textAnchor="middle"
                          className="text-[9px] fill-muted-foreground font-black uppercase"
                        >
                          {lbl} ({radarStats[idx]})
                        </text>
                      );
                    })}
                  </svg>
                </div>
              )}
            </Card>

            {/* Position count bar chart */}
            <Card className="p-5 border border-border/40 bg-card/60 backdrop-blur-md flex flex-col justify-center space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center lg:text-left">Position Roster Balance</h4>
              
              <div className="space-y-3.5 text-xs font-semibold">
                
                {/* GK Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground uppercase font-extrabold">Goalkeepers (GK)</span>
                    <span className="font-extrabold text-foreground">{gkCount} Players</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow bg-muted h-3 rounded-md overflow-hidden border border-border/40">
                      <div 
                        className="bg-amber-500 h-full rounded-md transition-all duration-300"
                        style={{ width: `${(gkCount / maxPosCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* DEF Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground uppercase font-extrabold">Defenders (DEF)</span>
                    <span className="font-extrabold text-foreground">{defCount} Players</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow bg-muted h-3 rounded-md overflow-hidden border border-border/40">
                      <div 
                        className="bg-blue-500 h-full rounded-md transition-all duration-300"
                        style={{ width: `${(defCount / maxPosCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* MID Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground uppercase font-extrabold">Midfielders (MID)</span>
                    <span className="font-extrabold text-foreground">{midCount} Players</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow bg-muted h-3 rounded-md overflow-hidden border border-border/40">
                      <div 
                        className="bg-emerald-500 h-full rounded-md transition-all duration-300"
                        style={{ width: `${(midCount / maxPosCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* FWD Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground uppercase font-extrabold">Forwards (FWD)</span>
                    <span className="font-extrabold text-foreground">{fwdCount} Players</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow bg-muted h-3 rounded-md overflow-hidden border border-border/40">
                      <div 
                        className="bg-rose-500 h-full rounded-md transition-all duration-300"
                        style={{ width: `${(fwdCount / maxPosCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

              </div>
            </Card>

          </div>
        </section>

        {/* ROW 3: INTERACTIVE SLANTED 3D FOOTBALL PITCH */}
        <section className="space-y-3">
          <div className="border-b border-border/60 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏟️</span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Lineup Editor (3D Pitch View)</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-block">
                Drag & Drop cards to swap positions
              </span>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted p-1 rounded uppercase tracking-wider">Own goal perspective</span>
            </div>
          </div>

          <div className="relative w-full max-w-[620px] mx-auto min-h-[460px] md:min-h-[500px] border border-border/50 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-4 bg-[#14231b] select-none">
            
            {/* 3D Slanted Grass Field Canvas */}
            <div 
              className="absolute inset-0 bg-[#234232] border-4 border-white/10 mx-5 my-8 rounded-xl overflow-hidden flex flex-col justify-between"
              style={{
                transform: "perspective(800px) rotateX(34deg) rotateZ(0deg)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
              }}
            >
              {/* Field Grass Stripes texture overlay */}
              <div className="absolute inset-0 flex flex-col divide-y divide-emerald-600/30">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className={`flex-1 ${idx % 2 === 0 ? "bg-emerald-950/20" : "bg-emerald-950/40"}`}></div>
                ))}
              </div>

              {/* Tactical White Lines */}
              <div className="absolute inset-0 border-[3px] border-white/20 pointer-events-none">
                
                {/* Halfway line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20"></div>
                
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-[3px] border-white/20"></div>
                
                {/* Away Penalty Box (top) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-b-[3px] border-x-[3px] border-white/20 bg-white/[0.02]"></div>
                
                {/* Home Penalty Box (bottom) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t-[3px] border-x-[3px] border-white/20 bg-white/[0.02]"></div>
              </div>
            </div>

            {/* 11 Position Slots Overlaid in 3D Coordinate Grid */}
            <div className="absolute inset-0 pt-4 pb-12 px-8 flex items-center justify-center">
              <div className="relative w-full h-full max-w-[560px]">
                {FORMATION_SLOTS[formation]?.map((slot, index) => {
                  const subIdx = 0;
                  const targetKey = `${index}_${subIdx}`;
                  const isDragOver = dragOverTarget === targetKey;

                  return (
                    <div
                      key={index}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10 flex flex-col items-center gap-1 ${
                        isDragOver ? "scale-125 z-40" : ""
                      }`}
                      style={{
                        top: slot.top,
                        left: slot.left
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverTarget !== targetKey) {
                          setDragOverTarget(targetKey);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget === targetKey) {
                          setDragOverTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverTarget(null);
                        const rawData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
                        if (!rawData) return;
                        try {
                          const data = JSON.parse(rawData);
                          if (data && typeof data.slotIndex === "number" && typeof data.subIndex === "number") {
                            handleSwapSlots(data.slotIndex, data.subIndex, index, subIdx);
                          }
                        } catch (err) {
                          console.error("Invalid drag drop data", err);
                        }
                      }}
                    >
                      {(() => {
                        const assignedSp = findSquadPlayer(index, subIdx);
                        const profile = assignedSp ? playerDetails[assignedSp.player_id] : null;

                        if (profile) {
                          return (
                            <div 
                              key={subIdx}
                              draggable
                              onDragStart={(e) => {
                                const dragData = JSON.stringify({ slotIndex: index, subIndex: subIdx, playerId: profile.id });
                                e.dataTransfer.setData("application/json", dragData);
                                e.dataTransfer.setData("text/plain", dragData);
                                setDraggedPlayer({ slotIndex: index, subIndex: subIdx, playerId: profile.id });
                              }}
                              onDragEnd={() => {
                                setDraggedPlayer(null);
                                setDragOverTarget(null);
                              }}
                              className={`flex items-center gap-1 bg-background/95 border rounded-full pl-1 pr-2.5 py-0.5 shadow-lg group/sub cursor-grab active:cursor-grabbing relative transition-all ${
                                isDragOver 
                                  ? "border-emerald-400 ring-4 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.8)] bg-emerald-950/90 text-white scale-110" 
                                  : "border-border/80 hover:border-primary/50"
                              }`}
                              onClick={() => {
                                router.push(`/analytics?id=${profile.id}`);
                              }}
                            >
                              {/* Overall Rating Circle */}
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-[9px]">
                                {profile.overall}
                              </div>
                              <span className="text-[8px] font-black text-foreground max-w-[50px] truncate leading-none">
                                {profile.name}
                              </span>
                              <span className="text-[8px] font-bold text-primary/70 uppercase">
                                {slot.label}
                              </span>

                              {/* Remove button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePlayerFromSlot(profile.id, profile.name);
                                }}
                                className="absolute -top-1 -right-1 hidden group-hover/sub:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/95 cursor-pointer shadow-sm z-30"
                                title="Remove player"
                              >
                                <Trash2 size={8} />
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <button
                              key={subIdx}
                              onClick={() => openSearchForSlot(index, subIdx)}
                              className={`h-5 px-2 rounded-full border border-dashed flex items-center gap-1 cursor-pointer transition-all duration-200 shadow-sm ${
                                isDragOver 
                                  ? "border-emerald-400 bg-emerald-500/30 text-white ring-4 ring-emerald-400/50 scale-110" 
                                  : "border-white/35 hover:border-white hover:bg-white/10 text-white/50 hover:text-white bg-[#162a1e]/85"
                              }`}
                              title={`Assign player to ${slot.label} or drop player card here`}
                            >
                              <Plus size={8} />
                              <span className="text-[8px] font-bold uppercase leading-none">
                                {slot.label}
                              </span>
                            </button>
                          );
                        }
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ROW 3.5: SUBSTITUTES & RESERVES (VISIBLE ALWAYS) */}
        <section className="space-y-3">
          <div className="border-b border-border/60 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Substitutes & Reserves</h3>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted p-1 rounded uppercase tracking-wider">
              {playersPerPos > 1 ? `Up to ${(playersPerPos - 1) * 11} substitute slots` : "No substitute slots active"}
            </span>
          </div>

          {playersPerPos === 1 ? (
            <Card className="border border-border/40 bg-card/60 backdrop-blur-md p-6 text-center text-xs text-muted-foreground italic">
              No substitute slots enabled. Increase "Players Per Position" in the Tactics sidebar panel to assign substitutes.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(() => {
                const subSlotsList: { slotIndex: number; label: string; subIndex: number }[] = [];
                FORMATION_SLOTS[formation]?.forEach((slot, index) => {
                  for (let s = 1; s < playersPerPos; s++) {
                    subSlotsList.push({ slotIndex: index, label: slot.label, subIndex: s });
                  }
                });

                return subSlotsList.map(({ slotIndex, label, subIndex }) => {
                  const assignedSp = findSquadPlayer(slotIndex, subIndex);
                  const profile = assignedSp ? playerDetails[assignedSp.player_id] : null;
                  const targetKey = `${slotIndex}_${subIndex}`;
                  const isDragOver = dragOverTarget === targetKey;

                  if (profile) {
                    return (
                      <Card 
                        key={targetKey} 
                        draggable
                        onDragStart={(e) => {
                          const dragData = JSON.stringify({ slotIndex, subIndex, playerId: profile.id });
                          e.dataTransfer.setData("application/json", dragData);
                          e.dataTransfer.setData("text/plain", dragData);
                          setDraggedPlayer({ slotIndex, subIndex, playerId: profile.id });
                        }}
                        onDragEnd={() => {
                          setDraggedPlayer(null);
                          setDragOverTarget(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverTarget !== targetKey) {
                            setDragOverTarget(targetKey);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverTarget === targetKey) {
                            setDragOverTarget(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTarget(null);
                          const rawData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
                          if (!rawData) return;
                          try {
                            const data = JSON.parse(rawData);
                            if (data && typeof data.slotIndex === "number" && typeof data.subIndex === "number") {
                              handleSwapSlots(data.slotIndex, data.subIndex, slotIndex, subIndex);
                            }
                          } catch (err) {
                            console.error("Invalid drag drop data", err);
                          }
                        }}
                        className={`p-3 border bg-card flex items-center justify-between gap-3 transition-all duration-200 relative group/sub cursor-grab active:cursor-grabbing ${
                          isDragOver 
                            ? "border-emerald-400 ring-4 ring-emerald-500/50 scale-105 shadow-lg bg-emerald-950/40" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div 
                          onClick={() => router.push(`/analytics?id=${profile.id}`)}
                          className="flex items-center gap-2 cursor-pointer min-w-0 flex-grow"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shrink-0">
                            {profile.overall}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate">{profile.name}</h4>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                              Sub {label} ({subIndex})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Swap/Promote Button */}
                          <button
                            onClick={() => swapStarterAndSub(slotIndex, subIndex)}
                            className="p-1 rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                            title="Swap with Starter"
                          >
                            <ArrowLeftRight size={13} />
                          </button>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removePlayerFromSlot(profile.id, profile.name)}
                            className="p-1 rounded bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                            title="Remove player"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </Card>
                    );
                  } else {
                    return (
                      <button
                        key={targetKey}
                        onClick={() => openSearchForSlot(slotIndex, subIndex)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverTarget !== targetKey) {
                            setDragOverTarget(targetKey);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverTarget === targetKey) {
                            setDragOverTarget(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTarget(null);
                          const rawData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
                          if (!rawData) return;
                          try {
                            const data = JSON.parse(rawData);
                            if (data && typeof data.slotIndex === "number" && typeof data.subIndex === "number") {
                              handleSwapSlots(data.slotIndex, data.subIndex, slotIndex, subIndex);
                            }
                          } catch (err) {
                            console.error("Invalid drag drop data", err);
                          }
                        }}
                        className={`h-14 p-3 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-card shadow-sm text-xs font-bold uppercase ${
                          isDragOver 
                            ? "border-emerald-400 bg-emerald-500/20 ring-4 ring-emerald-400/50 scale-105 text-white" 
                            : "border-white/20 hover:border-white/40 hover:bg-white/5 text-white/40 hover:text-white"
                        }`}
                        title={`Assign player to Sub ${label} ${subIndex} or drop player here`}
                      >
                        <Plus size={14} />
                        <span>{label} Sub ({subIndex})</span>
                      </button>
                    );
                  }
                });
              })()}
            </div>
          )}
        </section>

        {/* ROW 4: PLAYER ROSTER DATA MATRIX (FULL WIDTH) */}
        <section className="space-y-3">
          <div className="border-b border-border/60 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Player Roster</h3>
            </div>
            
            <Button
              onClick={exportSquadToCSV}
              size="sm"
              variant="outline"
              className="h-7 text-[10px] font-bold border-border hover:bg-muted cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Download size={11} />
              Export Roster
            </Button>
          </div>

          <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-extrabold uppercase text-[10px]">
                    <th className="px-4 py-3 text-center">Slot</th>
                    <th className="px-4 py-3">Player Name</th>
                    <th className="px-4 py-3">Club</th>
                    <th className="px-4 py-3 text-center">Nationality</th>
                    <th className="px-4 py-3 text-center">Age</th>
                    <th className="px-4 py-3 text-center">Rating</th>
                    <th className="px-4 py-3 text-center">Potential</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3 text-center">Foot</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground font-semibold">
                  {Array.from({ length: 11 }).map((_, index) => {
                    const slotLabel = FORMATION_SLOTS[formation]?.[index]?.label || `Pos ${index + 1}`;
                    const subIdx = 0;
                    const assignedSp = findSquadPlayer(index, subIdx);
                    const profile = assignedSp ? playerDetails[assignedSp.player_id] : null;
                    const uniqueKey = `${index}_${subIdx}`;

                    if (!profile) {
                      return (
                        <tr key={uniqueKey} className="hover:bg-muted/10">
                          <td className="px-4 py-3.5 text-center font-bold text-muted-foreground uppercase">
                            {slotLabel}
                          </td>
                          <td colSpan={8} className="px-4 py-3.5 text-muted-foreground italic text-xs">
                            Unassigned. Click slot on pitch to add.
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openSearchForSlot(index, subIdx)}
                              className="h-7 text-[10px] font-bold border-border hover:bg-muted cursor-pointer"
                            >
                              Add Player
                            </Button>
                          </td>
                        </tr>
                      );
                    }

                    const isStarred = starredPlayers[profile.id] || false;

                    const targetKey = `${index}_0`;
                    const isDragOver = dragOverTarget === targetKey;

                    return (
                      <tr 
                        key={uniqueKey} 
                        draggable
                        onDragStart={(e) => {
                          const dragData = JSON.stringify({ slotIndex: index, subIndex: 0, playerId: profile.id });
                          e.dataTransfer.setData("application/json", dragData);
                          e.dataTransfer.setData("text/plain", dragData);
                          setDraggedPlayer({ slotIndex: index, subIndex: 0, playerId: profile.id });
                        }}
                        onDragEnd={() => {
                          setDraggedPlayer(null);
                          setDragOverTarget(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverTarget !== targetKey) {
                            setDragOverTarget(targetKey);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverTarget === targetKey) {
                            setDragOverTarget(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTarget(null);
                          const rawData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
                          if (!rawData) return;
                          try {
                            const data = JSON.parse(rawData);
                            if (data && typeof data.slotIndex === "number" && typeof data.subIndex === "number") {
                              handleSwapSlots(data.slotIndex, data.subIndex, index, 0);
                            }
                          } catch (err) {
                            console.error("Invalid drag drop data", err);
                          }
                        }}
                        className={`transition-colors cursor-grab active:cursor-grabbing ${
                          isDragOver ? "bg-emerald-500/20 border-l-4 border-l-emerald-400" : "hover:bg-muted/20"
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center font-black text-primary uppercase">
                          {slotLabel}
                        </td>
                        <td className="px-4 py-3.5">
                          <div 
                            onClick={() => {
                              router.push(`/analytics?id=${profile.id}`);
                            }}
                            className="flex items-center gap-2.5 cursor-pointer group"
                          >
                            <img
                              src={profile.photo || DEFAULT_AVATAR}
                              alt={profile.name}
                              className="w-7 h-7 rounded-full object-cover bg-muted"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_AVATAR;
                              }}
                            />
                            <span className="font-extrabold group-hover:text-primary transition-colors flex items-center gap-1">
                              {profile.name}
                              <ArrowLeftRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{profile.club}</td>
                        <td className="px-4 py-3.5 text-center text-muted-foreground">{profile.nationality}</td>
                        <td className="px-4 py-3.5 text-center">{profile.age}</td>
                        <td className="px-4 py-3.5 text-center font-bold">
                          <span className="text-foreground">{profile.overall}</span>
                          <button 
                            onClick={() => toggleStarred(profile.id)}
                            className="ml-1 text-muted-foreground hover:text-amber-500 cursor-pointer"
                          >
                            <Star size={11} className={isStarred ? "fill-amber-500 text-amber-500" : ""} />
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-center text-accent font-bold">{profile.potential}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-foreground">{formatValue(profile.marketValue)}</td>
                        <td className="px-4 py-3.5 text-center text-muted-foreground">{profile.foot}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => removePlayerFromSlot(profile.id, profile.name)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                            title="Remove player"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

      </main>

      {/* 3. ASSIGNMENT MODAL / SEARCH POPUP */}
      {searchModalOpen && activeSlotIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-5 border border-border bg-card shadow-2xl flex flex-col space-y-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-foreground">
                Assign Player to {FORMATION_SLOTS[formation]?.[activeSlotIndex]?.label || "Slot"}
              </h3>
              <button 
                onClick={() => setSearchModalOpen(false)}
                className="text-xs font-semibold hover:text-foreground text-muted-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Input field */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                className="flex-grow px-3 py-2 rounded-lg bg-background border border-border text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <Button 
                onClick={handleSearch}
                size="sm" 
                className="font-bold flex items-center gap-1.5 shrink-0"
              >
                <Search size={13} />
                Search
              </Button>
            </div>

            {/* Search list results */}
            <div className="max-h-[250px] overflow-y-auto divide-y divide-border/60 text-xs">
              {searchLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Type a name above and click search.</p>
              ) : (
                searchResults.map((player) => (
                  <div 
                    key={player.id} 
                    className="py-2.5 flex items-center justify-between hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={player.face_url || player.photo || DEFAULT_AVATAR} 
                        alt={player.name} 
                        className="w-8 h-8 rounded-full object-cover bg-muted"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground">{player.name}</h4>
                        <p className="text-[9px] text-muted-foreground leading-none mt-0.5">
                          OVR {player.overall} • {player.position} • {player.club}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => assignPlayerToSlot(player)}
                      className="h-7 text-[10px] font-bold border-border hover:bg-muted cursor-pointer"
                    >
                      Assign
                    </Button>
                  </div>
                ))
              )}
            </div>

          </Card>
        </div>
      )}

      </div>
    </>
  );
}
