"use client";

import { Card } from "@/components/ui/card";

export default function PassingTab() {
  return (
    <Card className="p-10">
      <h2 className="text-2xl font-bold mb-2">
        Passing
      </h2>

      <p className="text-muted-foreground">
        Passing statistics will appear here.
      </p>
    </Card>
  );
}