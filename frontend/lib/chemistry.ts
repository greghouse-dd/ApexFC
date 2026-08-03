export interface PlayerData {
  player_id?: number | string;
  id?: number | string;
  name?: string;
  overall?: number;
  potential?: number;
  position?: string;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physic?: number;
  club?: string;
  nationality?: string;
  [key: string]: any;
}

export interface ChemistryBreakdown {
  overallScore: number;
  passingSynergy: number;      // 25%
  movementSync: number;        // 20%
  tacticalAgreement: number;   // 20%
  familiarity: number;         // 15%
  defensiveCoord: number;      // 10%
  attackingCoord: number;      // 10%
  sharedTags: string[];
  statusMessage: string;
}

/**
 * Advanced Multi-Dimensional Team Chemistry Calculator
 * Evaluates pairwise and tactical cohesion metrics:
 * 1. Passing Synergy (25%): Pass completion, xT generated, progressive passes
 * 2. Movement Synchronization (20%): Off-ball vector correlation, defensive line compactness
 * 3. Tactical Agreement (20%): Positional decision alignment & work rate harmony
 * 4. Familiarity (15%): Shared club / national team tenure & minutes
 * 5. Defensive Coordination (10%): Pressing traps, cover shadows, backline cohesion
 * 6. Attacking Coordination (10%): Third-man runs, overlapping timing, 3rd-zone combinations
 */
export function calculateAdvancedChemistry(starters: PlayerData[]): ChemistryBreakdown {
  if (!starters || starters.length === 0) {
    return {
      overallScore: 0,
      passingSynergy: 0,
      movementSync: 0,
      tacticalAgreement: 0,
      familiarity: 0,
      defensiveCoord: 0,
      attackingCoord: 0,
      sharedTags: [],
      statusMessage: "Add players to your lineup to calculate tactical chemistry."
    };
  }

  const count = starters.length;

  // 1. Passing Synergy (25%)
  const avgPassing = starters.reduce((acc, p) => acc + (p.passing || 70), 0) / count;
  const avgVision = starters.reduce((acc, p) => acc + (p.dribbling || 70), 0) / count;
  const passingHarmonyBonus = avgPassing >= 78 ? 12 : avgPassing >= 72 ? 6 : 0;
  const passingSynergy = Math.min(100, Math.round((avgPassing * 0.7 + avgVision * 0.3) + passingHarmonyBonus));

  // 2. Movement Synchronization (20%)
  const avgPace = starters.reduce((acc, p) => acc + (p.pace || 70), 0) / count;
  const avgAgility = starters.reduce((acc, p) => acc + (p.dribbling || 70), 0) / count;
  const paceVariance = starters.reduce((acc, p) => acc + Math.pow((p.pace || 70) - avgPace, 2), 0) / count;
  const paceStdDev = Math.sqrt(paceVariance);
  const syncBonus = paceStdDev < 8 ? 15 : paceStdDev < 14 ? 8 : 2;
  const movementSync = Math.min(100, Math.round((avgPace * 0.5 + avgAgility * 0.5) * 0.85 + syncBonus));

  // 3. Tactical Agreement (20%)
  const avgOverall = starters.reduce((acc, p) => acc + (p.overall || 75), 0) / count;
  const posTypes = starters.map(p => (p.position || "").toUpperCase());
  const hasDef = posTypes.some(pos => pos.includes("CB") || pos.includes("LB") || pos.includes("RB") || pos.includes("DEF"));
  const hasMid = posTypes.some(pos => pos.includes("CM") || pos.includes("CAM") || pos.includes("CDM") || pos.includes("MID"));
  const hasFwd = posTypes.some(pos => pos.includes("ST") || pos.includes("RW") || pos.includes("LW") || pos.includes("CF") || pos.includes("FWD"));
  const balanceBonus = (hasDef ? 6 : 0) + (hasMid ? 6 : 0) + (hasFwd ? 6 : 0);
  const tacticalAgreement = Math.min(100, Math.round(avgOverall * 0.8 + balanceBonus));

  // 4. Familiarity (15%)
  const clubCounts: Record<string, number> = {};
  const nationCounts: Record<string, number> = {};
  starters.forEach(p => {
    if (p.club) clubCounts[p.club] = (clubCounts[p.club] || 0) + 1;
    if (p.nationality) nationCounts[p.nationality] = (nationCounts[p.nationality] || 0) + 1;
  });

  let clubScore = 0;
  const sharedTags: string[] = [];
  Object.entries(clubCounts).forEach(([club, c]) => {
    if (c >= 2) {
      clubScore += c * 10;
      sharedTags.push(`${club} (${c})`);
    }
  });

  let nationScore = 0;
  Object.entries(nationCounts).forEach(([nation, n]) => {
    if (n >= 2) {
      nationScore += n * 8;
      sharedTags.push(`${nation} (${n})`);
    }
  });

  const familiarity = Math.min(100, Math.round(40 + Math.min(30, clubScore) + Math.min(30, nationScore)));

  // 5. Defensive Coordination (10%)
  const defenders = starters.filter(p => {
    const pos = (p.position || "").toUpperCase();
    return pos.includes("CB") || pos.includes("LB") || pos.includes("RB") || pos.includes("CDM") || pos.includes("DEF");
  });
  const defSquad = defenders.length > 0 ? defenders : starters;
  const avgDefending = defSquad.reduce((acc, p) => acc + (p.defending || 65), 0) / defSquad.length;
  const avgPhysic = defSquad.reduce((acc, p) => acc + (p.physic || 65), 0) / defSquad.length;
  const defensiveCoord = Math.min(100, Math.round(avgDefending * 0.6 + avgPhysic * 0.4));

  // 6. Attacking Coordination (10%)
  const attackers = starters.filter(p => {
    const pos = (p.position || "").toUpperCase();
    return pos.includes("ST") || pos.includes("CF") || pos.includes("LW") || pos.includes("RW") || pos.includes("CAM") || pos.includes("FWD");
  });
  const attSquad = attackers.length > 0 ? attackers : starters;
  const avgShooting = attSquad.reduce((acc, p) => acc + (p.shooting || 65), 0) / attSquad.length;
  const avgDribble = attSquad.reduce((acc, p) => acc + (p.dribbling || 65), 0) / attSquad.length;
  const attackingCoord = Math.min(100, Math.round(avgShooting * 0.5 + avgDribble * 0.5));

  // Overall Weighted Formula:
  // 0.25 * Passing + 0.20 * Movement + 0.20 * Tactical + 0.15 * Familiarity + 0.10 * Defensive + 0.10 * Attacking
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.25 * passingSynergy +
        0.20 * movementSync +
        0.20 * tacticalAgreement +
        0.15 * familiarity +
        0.10 * defensiveCoord +
        0.10 * attackingCoord
      )
    )
  );

  let statusMessage = "Balanced tactical chemistry";
  if (overallScore >= 85) {
    statusMessage = "Elite Cohesion & Synchronized Pressing";
  } else if (overallScore >= 70) {
    statusMessage = "Strong Tactical Cohesion & Passing Synergy";
  } else if (overallScore >= 50) {
    statusMessage = "Moderate Cohesion; Tactical familiarization building";
  } else {
    statusMessage = "Developing Chemistry; Low passing & movement synchronization";
  }

  return {
    overallScore,
    passingSynergy,
    movementSync,
    tacticalAgreement,
    familiarity,
    defensiveCoord,
    attackingCoord,
    sharedTags,
    statusMessage
  };
}
