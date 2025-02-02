import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, UserPlus, MoreVertical, Flag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  avatar: string | null;
  lastMessage?: string;
}

export function ChatPopup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: matches = [] } = useQuery<{ userId1: number; userId2: number }[]>({
    queryKey: ["/api/matches"],
    enabled: isOpen && !!user,
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: isOpen && !!user,
  });

  // Filter conversations to only include matched users
  const chatPartners = conversations.filter(partner => 
    matches.some(match => 
      (match.userId1 === user?.id && match.userId2 === partner.id) ||
      (match.userId2 === user?.id && match.userId1 === partner.id)
    )
  );

  const reportMessageMutation = useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: number; reason: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/messages/${messageId}/report`,
        { reason }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Reported",
        description: "Thank you for your report. We will review it shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Report Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReport = (messageId: number) => {
    if (window.confirm("Are you sure you want to report this message? This action cannot be undone.")) {
      reportMessageMutation.mutate({
        messageId,
        reason: "Inappropriate content",
      });
    }
  };

  const { data: messageHistory = [] } = useQuery<Message[]>({
    queryKey: [`/api/messages/${activeChat?.id}`],
    enabled: !!activeChat,
  });

  useEffect(() => {
    if (messageHistory.length > 0) {
      setMessages(messageHistory);
    }
  }, [messageHistory]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);
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
                        className={`flex items-start gap-2 ${
                          msg.senderId === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.senderId !== user.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => msg.id && handleReport(msg.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                {chatPartners.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    <div className="mb-4">
                      No conversations yet! Match with other gamers to start chatting.
                    </div>
                    <Link href="/matches">
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Find Matches
                      </Button>
                    </Link>
                  </div>
                ) : (
                  chatPartners.map((conv) => (
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