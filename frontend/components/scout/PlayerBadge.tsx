"use client";

interface Props {
  flag: string;

  club: string;

  position: string;
}

export default function PlayerBadge({
  flag,
  club,
  position,
}: Props) {
  return (
    <div className="space-y-1 text-sm">

      <div className="flex items-center gap-2">

        <span className="text-lg">
          {flag}
        </span>

        <span>{club}</span>

      </div>

      <div className="text-muted-foreground">

        {position}

      </div>

    </div>
  );
}