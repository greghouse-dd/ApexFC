import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3),

  email: z.email(),

  password: z.string().min(8),

  full_name: z.string(),

  favorite_club: z.string(),

  favorite_league: z.string(),
});

export type RegisterSchema =
  z.infer<typeof registerSchema>;