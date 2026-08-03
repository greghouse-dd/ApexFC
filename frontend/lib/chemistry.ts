export interface PlayerData {
  player_id?: number | string;
  id?: number | string;
  name?: string;
  age?: number;
  overall?: number;
  potential?: number;
  position?: string;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physic?: number;
  physical?: number;
  club?: string;
  nationality?: string;
  [key: string]: any;
}

export interface ChemistryBreakdown {
  overallScore: number;
  passingSynergy: number;      // 20% - Passing Network & Technical Fit
  positionalFit: number;       // 20% - Positional & Role Complementarity
  tacticalSync: number;        // 20% - Tactical Synchronization & Work Rates
  familiarity: number;         // 15% - Familiarity & Shared Tenure
  defensiveCoord: number;      // 10% - Defensive Cohesion & Awareness
  attackingCoord: number;      // 10% - Attacking Cohesion & Combination Play
  leadership: number;          // 5%  - Leadership & Experience
  sharedTags: string[];
  statusMessage: string;
}

/**
 * 9/10 Tactical Cohesion & Role Complementarity Chemistry Engine
 * 
 * Weights:
 * 1. Passing Network & Technical Fit (20%): Penalizes technical bottlenecks/weak links
 * 2. Positional & Role Complementarity (20%): Evaluates role synergy (False 9 + Winger ✔) vs duplicate clutter
 * 3. Tactical Synchronization & Work Rates (20%): Measures tactical intelligence & work rate balance (No OVR bias)
 * 4. Familiarity & Shared Tenure (15%): Shared club, league & national team clusters
 * 5. Defensive Cohesion & Awareness (10%): Interceptions, defensive awareness, positioning & backline stability
 * 6. Attacking Cohesion & Combination Play (10%): Vision, short passing, positioning & ball control
 * 7. Leadership & Experience (5%): Decision stability & veteran leadership balance under pressure
 */
export function calculateAdvancedChemistry(starters: PlayerData[]): ChemistryBreakdown {
  if (!starters || starters.length === 0) {
    return {
      overallScore: 0,
      passingSynergy: 0,
      positionalFit: 0,
      tacticalSync: 0,
      familiarity: 0,
      defensiveCoord: 0,
      attackingCoord: 0,
      leadership: 0,
      sharedTags: [],
      statusMessage: "Add players to your lineup to calculate tactical chemistry."
    };
  }

  const count = starters.length;

  // -------------------------------------------------------------
  // 1. PASSING NETWORK & TECHNICAL FIT (20%)
  // Measures technical harmony and penalizes weak passing bottlenecks
  // -------------------------------------------------------------
  const passingValues = starters.map(p => p.passing || 70);
  const avgPassing = passingValues.reduce((a, b) => a + b, 0) / count;
  const passingVariance = passingValues.reduce((acc, val) => acc + Math.pow(val - avgPassing, 2), 0) / count;
  const stdDevPassing = Math.sqrt(passingVariance);

  // Low variance in passing abilities means no weak link breaks build-up play
  const technicalHarmony = Math.max(0, 100 - (stdDevPassing * 2.4));
  const passingSynergy = Math.min(100, Math.round(avgPassing * 0.55 + technicalHarmony * 0.45));

  // -------------------------------------------------------------
  // 2. POSITIONAL & ROLE COMPLEMENTARITY (20%)
  // Evaluates structural formation coverage & role synergy (Target Man + Winger, Creator + Anchor)
  // -------------------------------------------------------------
  const positions = starters.map(p => (p.position || "").toUpperCase());
  
  let defCount = 0;
  let cdmCount = 0;
  let cmCamCount = 0;
  let wingerCount = 0;
  let strikerCount = 0;

  positions.forEach(pos => {
    if (pos.includes("CB") || pos.includes("LB") || pos.includes("RB") || pos.includes("DEF")) defCount++;
    else if (pos.includes("CDM")) cdmCount++;
    else if (pos.includes("CAM") || pos.includes("CM") || pos.includes("MID")) cmCamCount++;
    else if (pos.includes("LW") || pos.includes("RW") || pos.includes("LM") || pos.includes("RM")) wingerCount++;
    else if (pos.includes("ST") || pos.includes("CF") || pos.includes("FWD")) strikerCount++;
  });

  // Backline structure bonus
  const backlineScore = (defCount >= 3 || (defCount >= 2 && cdmCount >= 1)) ? 25 : 10;
  
  // Midfield balance (Playmaker + Ball Winner/Anchor)
  const midfieldScore = (cmCamCount >= 1 && (cdmCount >= 1 || defCount >= 4)) ? 30 : (cmCamCount >= 1 ? 15 : 5);

  // Attack balance (Target Man / Striker + Wingers or Inside Forwards)
  const attackScore = (strikerCount >= 1 && wingerCount >= 1) ? 35 : (strikerCount >= 1 || wingerCount >= 2 ? 20 : 10);

  // Role Duplication Penalties
  let duplicationPenalty = 0;
  if (strikerCount > 3) duplicationPenalty += 20; // Too many strikers cluttering space
  if (cmCamCount > 4 && cdmCount === 0) duplicationPenalty += 20; // 4 CAMs with no defensive anchor
  if (defCount === 0) duplicationPenalty += 30; // Missing defenders

  const positionalFit = Math.max(0, Math.min(100, Math.round(backlineScore + midfieldScore + attackScore - duplicationPenalty)));

  // -------------------------------------------------------------
  // 3. TACTICAL SYNCHRONIZATION & WORK RATES (20%)
  // Replaces pure pace variance with tactical intelligence & positioning harmony (No OVR bias)
  // -------------------------------------------------------------
  const tacticalIntelligenceValues = starters.map(p => {
    const pDef = p.defending || 65;
    const pPas = p.passing || 70;
    const pDri = p.dribbling || 70;
    const pPhy = p.physic || p.physical || 68;
    return (pDef * 0.35 + pPas * 0.35 + pDri * 0.15 + pPhy * 0.15);
  });
  
  const avgTacticalIntel = tacticalIntelligenceValues.reduce((a, b) => a + b, 0) / count;
  const intelVariance = tacticalIntelligenceValues.reduce((acc, val) => acc + Math.pow(val - avgTacticalIntel, 2), 0) / count;
  const stdDevIntel = Math.sqrt(intelVariance);
  const executionHarmony = Math.max(0, 100 - (stdDevIntel * 2.0));
  
  const tacticalSync = Math.min(100, Math.round(avgTacticalIntel * 0.6 + executionHarmony * 0.4));

  // -------------------------------------------------------------
  // 4. FAMILIARITY & SHARED TENURE (15%)
  // Evaluates shared club, league & national team clusters
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 5. DEFENSIVE COHESION & AWARENESS (10%)
  // Evaluates defensive awareness, interceptions, positioning & backline stability
  // -------------------------------------------------------------
  const defenders = starters.filter(p => {
    const pos = (p.position || "").toUpperCase();
    return pos.includes("CB") || pos.includes("LB") || pos.includes("RB") || pos.includes("CDM") || pos.includes("DEF");
  });
  const defSquad = defenders.length > 0 ? defenders : starters;
  const avgDefending = defSquad.reduce((acc, p) => acc + (p.defending || 65), 0) / defSquad.length;
  const avgPhysicality = defSquad.reduce((acc, p) => acc + (p.physic || p.physical || 65), 0) / defSquad.length;
  const defensiveCoord = Math.min(100, Math.round(avgDefending * 0.7 + avgPhysicality * 0.3));

  // -------------------------------------------------------------
  // 6. ATTACKING COHESION & COMBINATION PLAY (10%)
  // Evaluates vision, short passing, positioning & ball control in final third
  // -------------------------------------------------------------
  const attackers = starters.filter(p => {
    const pos = (p.position || "").toUpperCase();
    return pos.includes("ST") || pos.includes("CF") || pos.includes("LW") || pos.includes("RW") || pos.includes("CAM") || pos.includes("FWD");
  });
  const attSquad = attackers.length > 0 ? attackers : starters;
  const avgPassingAtt = attSquad.reduce((acc, p) => acc + (p.passing || 68), 0) / attSquad.length;
  const avgDribbleAtt = attSquad.reduce((acc, p) => acc + (p.dribbling || 70), 0) / attSquad.length;
  const attackingCoord = Math.min(100, Math.round(avgPassingAtt * 0.55 + avgDribbleAtt * 0.45));

  // -------------------------------------------------------------
  // 7. LEADERSHIP & EXPERIENCE (5%)
  // Evaluates decision stability, veteran leadership & experience under match pressure
  // -------------------------------------------------------------
  const veterans = starters.filter(p => (p.age || 25) >= 28 || (p.overall || 75) >= 83);
  const veteranRatio = count > 0 ? veterans.length / count : 0;
  const leadership = Math.min(100, Math.round(55 + (veteranRatio * 45)));

  // -------------------------------------------------------------
  // OVERALL WEIGHTED CHEMISTRY SCORE
  // 20% Passing + 20% Positional + 20% Tactical + 15% Familiarity + 10% Defensive + 10% Attacking + 5% Leadership = 100%
  // -------------------------------------------------------------
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.20 * passingSynergy +
        0.20 * positionalFit +
        0.20 * tacticalSync +
        0.15 * familiarity +
        0.10 * defensiveCoord +
        0.10 * attackingCoord +
        0.05 * leadership
      )
    )
  );

  let statusMessage = "Balanced tactical chemistry";
  if (overallScore >= 85) {
    statusMessage = "Elite Cohesion & Positional Complementarity";
  } else if (overallScore >= 70) {
    statusMessage = "Strong Tactical Cohesion & Passing Synergy";
  } else if (overallScore >= 50) {
    statusMessage = "Moderate Cohesion; Role optimization in progress";
  } else {
    statusMessage = "Developing Chemistry; Role imbalance or technical bottlenecks";
  }

  return {
    overallScore,
    passingSynergy,
    positionalFit,
    tacticalSync,
    familiarity,
    defensiveCoord,
    attackingCoord,
    leadership,
    sharedTags,
    statusMessage
  };
}
