'use client';

import { useState, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { SuggestionChips } from '@/components/chat/SuggestionChips';
import { RecommendationCard } from '@/components/chat/RecommendationCard';
import type { Vendor } from '@/lib/scoring/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedVendorId: string | null;
  reasoning: string[];
}

interface ChatPanelProps {
  vendors: Vendor[];
}

export function ChatPanel({ vendors }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 50);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        recommendedVendorId: null,
        reasoning: [],
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setLoading(true);
      scrollToBottom();

      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = (await res.json()) as {
          response: string;
          recommendedVendorId: string | null;
          reasoning: string[];
        };

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          recommendedVendorId: data.recommendedVendorId,
          reasoning: data.reasoning,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        scrollToBottom();
      } catch {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          recommendedVendorId: null,
          reasoning: [],
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [loading, scrollToBottom]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const getVendorName = (id: string): string => {
    return vendors.find((v) => v.id === id)?.name ?? id;
  };

  return (
    <>
      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          data-testid="chat-toggle"
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      <div
        data-testid="chat-panel"
        className={cn(
          'fixed bottom-6 right-6 z-50 flex w-[400px] flex-col rounded-xl border border-border bg-card shadow-2xl transition-all duration-300',
          open
            ? 'h-[560px] opacity-100 translate-y-0'
            : 'h-0 opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ask SignalCore</p>
              <p className="text-[10px] text-muted-foreground">AI-powered vendor advisor</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                How can I help you choose?
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
                Ask me about vendor capabilities, pricing, or specific requirements.
              </p>
              <div className="mt-4 w-full">
                <SuggestionChips onSelect={handleSend} />
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <ChatMessage role={msg.role} content={msg.content} />
              {msg.role === 'assistant' && msg.recommendedVendorId && (
                <div className="ml-10">
                  <RecommendationCard
                    vendorName={getVendorName(msg.recommendedVendorId)}
                    reasoning={msg.reasoning}
                  />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analyzing vendors...</span>
            </div>
          )}
        </div>

        {/* Suggestion chips when there are messages */}
        {messages.length > 0 && !loading && (
          <div className="border-t border-border px-4 py-2">
            <SuggestionChips onSelect={handleSend} />
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about vendors..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              disabled={loading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
