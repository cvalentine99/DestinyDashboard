import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessageSquare, X, Send, Loader2, Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";

// Ghost icon SVG
const GhostIcon = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" fill="currentColor">
    <circle cx="50" cy="50" r="35" />
    <circle cx="50" cy="50" r="25" fill="oklch(0.12 0.02 250)" />
    <circle cx="50" cy="50" r="15" />
    <path d="M50 15 L55 30 L50 25 L45 30 Z" />
    <path d="M85 50 L70 55 L75 50 L70 45 Z" />
    <path d="M50 85 L45 70 L50 75 L55 70 Z" />
    <path d="M15 50 L30 45 L25 50 L30 55 Z" />
  </svg>
);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; category: string }[];
}

export default function LoreChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => nanoid());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isAuthenticated } = useAuth();
  
  const chatMutation = trpc.lore.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: nanoid(),
        role: "assistant",
        content: data.message,
        sources: data.sources,
      }]);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        id: nanoid(),
        role: "assistant",
        content: "I'm having trouble accessing my memory banks, Guardian. Please try again.",
      }]);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ message: input.trim(), sessionId });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Welcome message
  const welcomeMessage = `Greetings, Guardian. I am your Ghost, keeper of Destiny's vast lore. Ask me anything about:

• **The Traveler** and the Light
• **The Darkness** and its disciples  
• **The Books of Sorrow** and Hive history
• **The Nine** and their mysteries
• **Guardians**, Vanguard, and the Last City
• **Fallen Houses**, Cabal, Vex, and more

What would you like to know?`;

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? "bg-destructive hover:bg-destructive/90" 
            : "bg-primary hover:bg-primary/90"
        }`}
        style={{
          boxShadow: isOpen 
            ? "0 0 20px oklch(0.55 0.22 25 / 0.4)" 
            : "0 0 20px oklch(0.72 0.15 185 / 0.4)",
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <GhostIcon />
        )}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <Card 
          className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] shadow-2xl border-primary/30"
          style={{
            background: "linear-gradient(135deg, oklch(0.15 0.02 250) 0%, oklch(0.12 0.02 250) 100%)",
            boxShadow: "0 0 40px oklch(0.72 0.15 185 / 0.2)",
          }}
        >
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="text-primary">
                <GhostIcon />
              </div>
              <div>
                <span className="text-gradient-destiny">Ghost</span>
                <span className="text-xs text-muted-foreground block tracking-wider">
                  DESTINY LORE ASSISTANT
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <GhostIcon />
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-lg p-3 text-sm">
                      <Streamdown>{welcomeMessage}</Streamdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <div key={message.id} className="mb-4">
                  <div className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user" 
                        ? "bg-secondary/20 text-secondary" 
                        : "bg-primary/20 text-primary"
                    }`}>
                      {message.role === "user" ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <GhostIcon />
                      )}
                    </div>
                    <div className={`flex-1 rounded-lg p-3 text-sm ${
                      message.role === "user" 
                        ? "bg-secondary/20 text-foreground" 
                        : "bg-muted/50"
                    }`}>
                      <Streamdown>{message.content}</Streamdown>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="text-xs text-muted-foreground">
                            Sources: {message.sources.map(s => s.title).join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {chatMutation.isPending && (
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <GhostIcon />
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching the archives...
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Destiny lore..."
                    className="flex-1 bg-input border-border"
                    disabled={chatMutation.isPending}
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || chatMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-5 w-5 mx-auto mb-2 text-primary" />
                  Sign in to chat with Ghost
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
