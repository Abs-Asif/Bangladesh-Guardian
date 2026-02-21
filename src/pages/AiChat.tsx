import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, User, Bot, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import puter from "@heyputer/puter.js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AiChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Ai chat";
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await puter.ai.chat(
        [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { model: "google/gemini-3-pro-preview", stream: true }
      );

      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for await (const part of response) {
        if (part?.text) {
          assistantContent += part.text;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantContent;
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-1/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold font-mono gradient-text leading-none">
              Ai chat
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground">
              google/gemini-3-pro-preview
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Clear chat"
        >
          <Trash2 size={18} />
        </button>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center">
              <Bot size={32} className="text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-mono font-bold uppercase tracking-wider">
                System Initialized
              </h3>
              <p className="text-xs max-w-[200px]">
                Ready to assist with Gemini 3 Pro Preview.
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 animate-fade-in-up",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                message.role === "user"
                  ? "bg-primary/20 border-primary/30"
                  : "bg-accent/20 border-accent/30"
              )}
            >
              {message.role === "user" ? (
                <User size={16} className="text-primary" />
              ) : (
                <Bot size={16} className="text-accent" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-surface-2 border border-border prose prose-invert prose-sm"
              )}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-accent" />
            </div>
            <div className="bg-surface-2 border border-border rounded-2xl px-4 py-2 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-accent" />
              <span className="text-xs font-mono text-muted-foreground">
                THINKING...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-surface-1/50 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 max-w-4xl mx-auto"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all active:scale-95"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
