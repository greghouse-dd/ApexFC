"use client";

import { Card } from "@/components/ui/card";

export default function PhysicalTab() {
  return (
    <Card className="p-10">
      <h2 className="text-2xl font-bold mb-2">
        Physical
      </h2>

      <p className="text-muted-foreground">
        Physical statistics will appear here.
      </p>
    </Card>
  );
}