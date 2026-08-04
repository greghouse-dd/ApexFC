import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),

  email: z.string().email("Invalid email address"),

  password: z.string().min(1, "Password is required"),

  full_name: z.string().optional().or(z.literal("")),

  favorite_club: z.string().optional().or(z.literal("")),

  favorite_league: z.string().optional().or(z.literal("")),
});

export type RegisterSchema =
  z.infer<typeof registerSchema>;