"use client";

import { Card } from "@/components/ui/card";
import PlayerPicker from "./PlayerPicker";

export default function ComparisonTab() {
  return (
    <Card className="space-y-8 p-8">

      <h2 className="text-2xl font-bold">
        Head-to-Head Comparison
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-end">

        <PlayerPicker label="Player A" />

        <div className="text-center text-3xl font-bold text-muted-foreground">
          VS
        </div>

        <PlayerPicker label="Player B" />

      </div>

    </Card>
  );
}