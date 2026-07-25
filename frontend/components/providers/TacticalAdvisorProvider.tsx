"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { askTacticalAdvisor } from "@/services/api";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TacticalAdvisorContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (query: string) => Promise<void>;
}

const TacticalAdvisorContext = createContext<TacticalAdvisorContextType | undefined>(undefined);

export function TacticalAdvisorProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("apex_tactical_chat");
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored chat history", e);
        }
      } else {
        setMessages([
          {
            role: "assistant",
            content: "Hello Coach! I am your AI Tactical Advisor. Ask me anything about football philosophy, pressing triggers, structural formations, or transitions.",
          },
        ]);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save chat history to sessionStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      sessionStorage.setItem("apex_tactical_chat", JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    // Append user message immediately
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const data = await askTacticalAdvisor(query);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error accessing my tactical database." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TacticalAdvisorContext.Provider value={{ messages, loading, sendMessage }}>
      {children}
    </TacticalAdvisorContext.Provider>
  );
}

export function useTacticalAdvisor() {
  const context = useContext(TacticalAdvisorContext);
  if (!context) {
    throw new Error("useTacticalAdvisor must be used within a TacticalAdvisorProvider");
  }
  return context;
}
