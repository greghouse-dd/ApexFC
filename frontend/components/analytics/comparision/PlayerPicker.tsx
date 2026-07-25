"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PlayerPickerProps {
  label: string;
}

export default function PlayerPicker({
  label,
}: PlayerPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />

        <Input
          placeholder="Search player..."
          className="pl-10"
        />
      </div>
    </div>
  );
}