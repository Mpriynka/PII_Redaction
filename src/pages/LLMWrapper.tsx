import { useState, useRef, useEffect } from "react";
import { Send, Settings2, Wifi, WifiOff, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { UnderDevBanner } from "@/components/UnderDevBanner";

interface LLMConnection {
  type: "local" | "chatgpt" | "gemini";
  endpoint?: string;
  apiKey?: string;
  connected: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  original: string;
  redacted: string;
  deRedacted?: string;
}

// Simple mock redaction/de-redaction
const mockRedact = (text: string) => {
  const map: Record<string, string> = {};
  let counter = 1;
  let redacted = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, (match) => {
    const key = `[NAME_${counter}]`;
    map[key] = match;
    counter++;
    return key;
  });
  redacted = redacted.replace(/\b[\w.]+@[\w.]+\.\w+\b/g, (match) => {
    const key = `[EMAIL_${counter}]`;
    map[key] = match;
    counter++;
    return key;
  });
  return { redacted, map };
};

const mockDeRedact = (text: string, map: Record<string, string>) => {
  let result = text;
  Object.entries(map).forEach(([key, value]) => {
    result = result.split(key).join(value);
  });
  return result;
};

const MOCK_RESPONSES = [
  "Based on the information provided, I can help you with that request. The details have been processed and here is my analysis.",
  "I've reviewed the content you shared. Here are my recommendations based on the data.",
  "Thank you for sharing that. Let me provide a comprehensive response to your query.",
];

export default function LLMWrapper() {
  const [connection, setConnection] = useState<LLMConnection>(() => {
    const saved = localStorage.getItem("llm-connection");
    return saved ? JSON.parse(saved) : { type: "local", connected: false };
  });
  const [showSetup, setShowSetup] = useState(!connection.connected);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showRedactions, setShowRedactions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [localEndpoint, setLocalEndpoint] = useState(connection.endpoint || "");
  const [apiKey, setApiKey] = useState(connection.apiKey || "");
  const [connType, setConnType] = useState(connection.type);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveConnection = () => {
    const conn: LLMConnection = {
      type: connType,
      endpoint: connType === "local" ? localEndpoint : undefined,
      apiKey: connType !== "local" ? apiKey : undefined,
      connected: true,
    };
    setConnection(conn);
    localStorage.setItem("llm-connection", JSON.stringify(conn));
    setShowSetup(false);
    toast({ title: "Connected!", description: `${connType} LLM connected successfully.` });
  };

  const disconnect = () => {
    setConnection({ type: "local", connected: false });
    localStorage.removeItem("llm-connection");
    setShowSetup(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const { redacted, map } = mockRedact(input);

    const userMsg: ChatMessage = { role: "user", original: input, redacted };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate LLM response
    setTimeout(() => {
      const mockResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      // Simulate that the response might contain redacted tokens
      const responseWithTokens = mockResponse + (Object.keys(map).length > 0 ? ` Regarding ${Object.keys(map)[0]}, the analysis shows positive results.` : "");
      const deRedacted = mockDeRedact(responseWithTokens, map);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        original: responseWithTokens,
        redacted: responseWithTokens,
        deRedacted,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1500);
  };

  if (showSetup) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <UnderDevBanner />
        <h1 className="text-2xl font-bold mb-2">LLM Wrapper</h1>
        <p className="text-muted-foreground mb-6">Connect to an LLM and auto-redact PII in prompts and responses.</p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={connType} onValueChange={(v) => setConnType(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="local" className="flex-1">Local LLM</TabsTrigger>
                <TabsTrigger value="chatgpt" className="flex-1">ChatGPT</TabsTrigger>
                <TabsTrigger value="gemini" className="flex-1">Gemini</TabsTrigger>
              </TabsList>
              <TabsContent value="local" className="space-y-3 mt-3">
                <label className="text-sm font-medium">Endpoint URL</label>
                <Input disabled placeholder="http://localhost:11434/v1" value={localEndpoint} onChange={(e) => setLocalEndpoint(e.target.value)} />
              </TabsContent>
              <TabsContent value="chatgpt" className="space-y-3 mt-3">
                <label className="text-sm font-medium">API Key</label>
                <Input disabled type="password" placeholder="sk-…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </TabsContent>
              <TabsContent value="gemini" className="space-y-3 mt-3">
                <label className="text-sm font-medium">API Key</label>
                <Input disabled type="password" placeholder="AI…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </TabsContent>
            </Tabs>
            <Button disabled className="w-full" onClick={saveConnection}>
              <Wifi className="h-4 w-4 mr-2" /> Connect (Disabled)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <UnderDevBanner />
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">LLM Chat</h1>
          <span className="flex items-center gap-1 text-xs text-success">
            <Wifi className="h-3 w-3" /> {connection.type}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowRedactions(!showRedactions)}>
            {showRedactions ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            {showRedactions ? "Hide" : "Show"} Redactions
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSetup(true)}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={disconnect}>
            <WifiOff className="h-4 w-4 mr-1" /> Disconnect
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Your PII will be automatically redacted before sending to the LLM.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[70%] rounded-lg px-4 py-2.5 text-sm",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {msg.role === "user" ? msg.original : (msg.deRedacted || msg.original)}
            </div>
            {showRedactions && msg.redacted !== msg.original && (
              <div className="max-w-[70%] rounded border px-3 py-1.5 text-xs text-muted-foreground bg-muted/50">
                <span className="font-semibold text-xs">
                  {msg.role === "user" ? "Sent as:" : "Raw response:"}
                </span>{" "}
                {msg.redacted}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-muted rounded-lg px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Input
            disabled
            placeholder="Messaging is currently disabled"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
