"use client";

import { useState, useEffect, useRef } from "react";
import { useTacticalAdvisor } from "@/components/providers/TacticalAdvisorProvider";
import { Send, Bot, User, Loader2 } from "lucide-react";
import Markdown from "@/components/ui/Markdown";

export default function TacticalAdvisorTab() {
  const [query, setQuery] = useState("");
  const { messages, loading, sendMessage } = useTacticalAdvisor();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userQuery = query;
    setQuery("");
    await sendMessage(userQuery);
  };


  return (
    <div className="flex flex-col h-[600px] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
      
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
          <Bot className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Tactical Advisor AI</h3>
          <p className="text-xs text-blue-400">RAG Vector Database Active</p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-emerald-500 text-white rounded-tr-none' 
                : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
            }`}>
              {msg.role === 'user' ? msg.content : <Markdown text={msg.content} />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/20 border-t border-white/10">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about tiki-taka, half-spaces, or pressing traps..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-gray-500 transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-2 p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
