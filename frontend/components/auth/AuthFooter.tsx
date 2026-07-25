"use client";

export default function AuthFooter() {
  return (
    <footer className="relative z-10 border-t py-6">

      <div className="flex flex-col items-center gap-3">

        <p className="text-xs text-muted-foreground">

          © 2026 ApexFC Analytics

        </p>

        <div className="flex gap-5 text-xs">

          <a href="#">Terms</a>

          <a href="#">Privacy</a>

          <a href="#">Security</a>

        </div>

      </div>

    </footer>
  );
}