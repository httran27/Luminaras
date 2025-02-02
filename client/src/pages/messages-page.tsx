import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, UserPlus, MoreVertical, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { SelectUser } from "@db/schema";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<SelectUser | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const { data: matches = [] } = useQuery<{ userId1: number; userId2: number }[]>({
    queryKey: ["/api/matches"],
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/messages/conversations"],
  });

  // Filter chat partners to only include matched users
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

  useEffect(() => {
    if (!user) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      window.location.host
    }/ws?userId=${user.id}`;

    const websocket = new WebSocket(wsUrl);
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Only add message if it's from the selected user
      if (message.senderId === selectedUser?.id || message.receiverId === selectedUser?.id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    setWs(websocket);
    return () => websocket.close();
  }, [user, selectedUser]);

  const handleReport = (messageId: number) => {
    if (window.confirm("Are you sure you want to report this message? This action cannot be undone.")) {
      reportMessageMutation.mutate({
        messageId,
        reason: "Inappropriate content",
      });
    }
  };

  const sendMessage = () => {
    if (!ws || !selectedUser || !messageInput.trim()) return;

    const message = {
      type: "message",
      senderId: user!.id,
      receiverId: selectedUser.id,
      content: messageInput.trim(),
    };

    ws.send(JSON.stringify(message));
    // Add the message to the local state
    setMessages(prev => [...prev, { ...message, id: Date.now(), createdAt: new Date().toISOString() }]);
    setMessageInput("");
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-12rem)]">
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {chatPartners.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-muted-foreground mb-4">
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
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {chatPartners.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedUser(contact);
                    setMessages([]); // Clear messages when switching users
                  }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                    selectedUser?.id === contact.id ? "bg-muted" : ""
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={contact.avatar || undefined} />
                    <AvatarFallback>
                      {contact.displayName?.[0] ?? contact.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">
                      {contact.displayName ?? contact.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contact.gamerType || "Gamer"}
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        {selectedUser ? (
          <>
            <CardHeader className="border-b">
              <CardTitle>{selectedUser.displayName ?? selectedUser.username}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[calc(100vh-16rem)]">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 items-start ${
                        message.senderId === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.senderId !== user?.id && (
                        <>
                          <Avatar>
                            <AvatarImage src={selectedUser.avatar || undefined} />
                            <AvatarFallback>
                              {selectedUser.displayName?.[0] ?? selectedUser.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() => handleReport(message.id)}
                                className="text-destructive"
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Report Message
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[70%] ${
                          message.senderId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                  />
                  <Button type="submit">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="h-full flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </CardContent>
        )}
      </Card>
    </div>
  );
}