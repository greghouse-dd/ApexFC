"use client";

import Link from "next/link";
import { Mail, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, LoginSchema } from "@/lib/validators/login";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { saveToken } from "@/lib/token";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    console.log("Login submitted");
    console.log(data);
    try {
      const response = await loginUser(
        data.email,
        data.password
      );
      saveToken(response.access_token);
      await refreshUser();

      toast.success("Welcome back!");

      router.push("/dashboard");

    } catch (error: any) {
      toast.error(
        error.response?.data?.detail ??
        "Invalid email or password."
      );

      console.error(error);
    }
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          WELCOME BACK
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Sign In
        </h1>

        <p className="mt-2 text-muted-foreground">
          Access your football analytics workspace.
        </p>
      </div>

      <div className="space-y-2">
        <label>Email</label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="email"
            placeholder="you@example.com"
            className="h-12 pl-10"
            {...form.register("email")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label>Password</label>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="password"
            placeholder="••••••••"
            className="h-12 pl-10"
            {...form.register("password")}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          Remember Me
        </label>

        <button
          type="button"
          className="text-primary hover:underline"
        >
          Forgot Password?
        </button>
      </div>

      <Button type="submit" className="h-12 w-full">
        Sign In
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?

        <Link
          href="/register"
          className="ml-2 text-primary hover:underline"
        >
          Register
        </Link>
      </p>

    </form>
  );
}