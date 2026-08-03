"use client";

import Link from "next/link";
import { User, Mail, Lock, Trophy } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/lib/auth";

import { toast } from "sonner";

import { useRouter } from "next/navigation";


import {
  registerSchema,
  type RegisterSchema,
} from "@/lib/validators/register";

export default function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      full_name: "",
      favorite_club: "",
      favorite_league: "",
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    try {
      const response = await registerUser(data);

      toast.success("Account created successfully!");

      console.log(response);

      setTimeout(() => {
        router.push("/login");
      }, 1200);

    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errorMsg = "Something went wrong. Please check your credentials and try again.";
      if (typeof detail === "string") {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail.map((d: any) => `${d.loc?.[d.loc.length - 1] || 'Field'}: ${d.msg}`).join("; ");
      } else if (error.message === "Network Error" || !error.response) {
        errorMsg = "Network Error: Unable to reach backend API. Ensure NEXT_PUBLIC_API_URL is configured with HTTPS on Vercel.";
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);
      console.error("Registration failed:", error);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Heading */}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          JOIN THE ANALYTICS PLATFORM
        </p>

        <h1 className="text-4xl font-bold">
          Create Account
        </h1>

        <p className="mt-2 text-muted-foreground">
          Build your football intelligence workspace.
        </p>
      </div>

      {/* Username */}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Username
        </label>

        <div className="relative">
          <User
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            {...form.register("username")}
            placeholder="asher"
            className="h-12 pl-10"
          />
        </div>

        {form.formState.errors.username && (
          <p className="text-sm text-red-500">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      {/* Email */}

      <div className="space-y-2">
        <label>Email</label>

        <div className="relative">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            type="email"
            {...form.register("email")}
            placeholder="you@example.com"
            className="h-12 pl-10"
          />
        </div>

        {form.formState.errors.email && (
          <p className="text-sm text-red-500">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}

      <div className="space-y-2">
        <label>Password</label>

        <div className="relative">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            type="password"
            {...form.register("password")}
            placeholder="••••••••"
            className="h-12 pl-10"
          />
        </div>

        {form.formState.errors.password && (
          <p className="text-sm text-red-500">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* Full Name */}

      <div className="space-y-2">
        <label>Full Name</label>

        <div className="relative">
          <User
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            {...form.register("full_name")}
            placeholder="Asher Weasley"
            className="h-12 pl-10"
          />
        </div>

        {form.formState.errors.full_name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.full_name.message}
          </p>
        )}
      </div>

      {/* Favourite Club */}

      <div className="space-y-2">
        <label>Favourite Club</label>

        <div className="relative">
          <Trophy
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            {...form.register("favorite_club")}
            placeholder="Manchester City"
            className="h-12 pl-10"
          />
        </div>

        {form.formState.errors.favorite_club && (
          <p className="text-sm text-red-500">
            {form.formState.errors.favorite_club.message}
          </p>
        )}
      </div>

      {/* Favourite League */}

      <div className="space-y-2">
        <label>Favourite League</label>

        <Input
          {...form.register("favorite_league")}
          placeholder="Premier League"
          className="h-12"
        />

        {form.formState.errors.favorite_league && (
          <p className="text-sm text-red-500">
            {form.formState.errors.favorite_league.message}
          </p>
        )}
      </div>

      {/* Submit */}

      <Button
        type="submit"
        className="h-12 w-full text-base"
      >
        Create Account
      </Button>

      {/* Footer */}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?

        <Link
          href="/login"
          className="ml-2 text-primary hover:underline"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}