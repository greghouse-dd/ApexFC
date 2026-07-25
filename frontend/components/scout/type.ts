export interface Player {
  id: number;

  name: string;

  photo: string;

  nationality: string;

  nationalityFlag: string;

  club: string;

  clubLogo: string;

  position: string;

  league: string;

  season: string;

  age: number;

  foot: "Left" | "Right" | "Both";

  overall: number;

  potential: number;

  marketValue: number;

  xG: number;

  xA: number;

  progressiveCarries: number;

  progressivePasses: number;

  goals: number;

  passAccuracy: number;

  height: number;

  weight: number;
}