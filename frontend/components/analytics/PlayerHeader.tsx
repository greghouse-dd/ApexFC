"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export default function PlayerHeader() {
  return (
    <Card className="flex items-center gap-6 p-6">

      <Avatar className="h-24 w-24">

        <AvatarFallback>
          JB
        </AvatarFallback>

      </Avatar>

      <div>

        <h1 className="text-3xl font-bold">
          Jude Bellingham
        </h1>

        <p className="text-muted-foreground">
          Real Madrid • Midfielder
        </p>

        <div className="mt-4 flex gap-8 text-sm">

          <div>

            <p className="text-muted-foreground">
              Age
            </p>

            <p>22</p>

          </div>

          <div>

            <p className="text-muted-foreground">
              Market Value
            </p>

            <p>€180M</p>

          </div>

          <div>

            <p className="text-muted-foreground">
              Nationality
            </p>

            <p>England</p>

          </div>

        </div>

      </div>

    </Card>
  );
}