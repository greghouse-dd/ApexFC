"use client";

import TacticalAdvisorTab from "@/components/ai/TacticalAdvisorTab";
import { Bot } from "lucide-react";

export default function TacticsPage() {
  return (
    <div 
      className="flex-grow flex flex-col h-full bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/images/tactical/tact-1.jpg')" }}
    >
      {/* Dark overlay for contrast and readability */}
      <div className="absolute inset-0 bg-background/65 backdrop-blur-[1px] pointer-events-none" />

      <div className="flex-1 overflow-y-auto relative z-10 w-full">
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
          
          {/* Header section */}
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
                AI Tactical Assistant
              </h1>
              <p className="text-xs text-muted-foreground">
                Interact with our advanced tactical engine trained on football philosophy, positional play, and press triggers.
              </p>
            </div>
          </div>

          {/* Chatbot container */}
          <TacticalAdvisorTab />

        </div>
      </div>
    </div>
  );
}
