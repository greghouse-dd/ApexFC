"use client";

export default function Pagination() {
  return (
    <div className="flex items-center justify-between border-t bg-card px-6 py-4">

      <p className="text-sm text-muted-foreground">

        Showing 1–20 of 11,286 players

      </p>

      <div className="flex items-center gap-2">

        <button className="rounded-lg border px-3 py-2">

          Prev

        </button>

        <button className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">

          1

        </button>

        <button className="rounded-lg border px-3 py-2">

          2

        </button>

        <button className="rounded-lg border px-3 py-2">

          3

        </button>

        <button className="rounded-lg border px-3 py-2">

          Next

        </button>

      </div>

    </div>
  );
}