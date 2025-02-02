import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface Message {
  id?: number;
  senderId: number;
  receiverId?: number;
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: number;
  username: string;
  displayName: string | null;
  lastMessage?: string;
}

export function ChatPopup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: isOpen && !!user,
  });

  useEffect(() => {
    if (!user || !isOpen) return;

    // Initialize WebSocket connection
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?userId=${user.id}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Only add message if it's from the active chat
      if (message.senderId === activeChat?.id || message.receiverId === activeChat?.id) {
        setMessages(prev => [...prev, message]);
      }
    };

    return () => {
      ws.close();
    };
  }, [user, isOpen, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat || !wsRef.current) return;

    const message = {
      type: "message",
      senderId: user!.id,
      receiverId: activeChat.id,
      content: inputMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    wsRef.current.send(JSON.stringify(message));
    setMessages(prev => [...prev, message]);
    setInputMessage("");
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 shadow-lg">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Messages</h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-96">
            {activeChat ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 p-3 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveChat(null);
                      setMessages([]); // Clear messages when going back
                    }}
                  >
                    Back
                  </Button>
                  <span className="font-medium">
                    {activeChat.displayName ?? activeChat.username}
                  </span>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 max-w-[80%] ${
                            msg.senderId === user.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-3 border-t">
                  <form className="flex gap-2" onSubmit={sendMessage}>
                    <Input
                      placeholder="Type a message..."
                      className="flex-1"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                    />
                    <Button type="submit" size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-3">
                {conversations?.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No conversations yet. Match with other gamers to start chatting!
                  </div>
                ) : (
                  conversations?.map((conv) => (
                    <Button
                      key={conv.id}
                      variant="ghost"
                      className="w-full justify-start mb-2"
                      onClick={() => {
                        setActiveChat(conv);
                        setMessages([]); // Clear messages when switching users
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">
                          {conv.displayName ?? conv.username}
                        </div>
                        {conv.lastMessage && (
                          <div className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </Card>
      ) : (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}