"use client";

import { Card } from "@/components/ui/card";

export default function AttackingTab() {
  return (
    <Card className="p-10">
      <h2 className="text-2xl font-bold mb-2">
        Attacking
      </h2>

      <p className="text-muted-foreground">
        Attacking statistics will appear here.
      </p>
    </Card>
  );
}