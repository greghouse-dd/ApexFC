"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { askTacticalAdvisor } from "@/services/api";
import { useAuth } from "@/components/providers/AuthProvider";

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
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Clear chat history on logout
  useEffect(() => {
    if (!authLoading && !user && isLoaded) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("apex_tactical_chat");
      }
      setMessages([
        {
          role: "assistant",
          content: "Hello Coach! I am your AI Tactical Advisor. Ask me anything about football philosophy, pressing triggers, structural formations, or transitions.",
        },
      ]);
    }
  }, [user, authLoading, isLoaded]);

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
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const baseUrl = (envUrl && envUrl.trim())
        ? envUrl.trim().replace(/\/+$/, "")
        : (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
          ? "https://apexfc-backend.onrender.com"
          : "http://127.0.0.1:8000");
      const response = await fetch(`${baseUrl}/ai/tactical-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with tactical advisor");
      }

      // Append empty assistant message to write streamed chunks into
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return updated;
          });
        }
      }
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
