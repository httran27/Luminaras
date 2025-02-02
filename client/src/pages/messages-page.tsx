import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Send } from "lucide-react";
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
  const [selectedUser, setSelectedUser] = useState<SelectUser | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Get all matches and conversations
  const { data: matches } = useQuery<{ userId1: number; userId2: number }[]>({
    queryKey: ["/api/matches"],
    enabled: !!user,
  });

  // Get users for matches
  const { data: matchedUsers } = useQuery<SelectUser[]>({
    queryKey: ["/api/users/matched"],
    enabled: !!matches?.length,
  });

  const { data: conversations } = useQuery<SelectUser[]>({
    queryKey: ["/api/messages/conversations"],
  });

  // Combine matches and conversations to get all possible chat partners
  const chatPartners = [...(conversations || [])];
  if (matchedUsers) {
    matchedUsers.forEach(matchedUser => {
      if (!chatPartners.some(p => p.id === matchedUser.id)) {
        chatPartners.push(matchedUser);
      }
    });
  }

  useEffect(() => {
    if (!user) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      window.location.host
    }/ws?userId=${user.id}`;

    const websocket = new WebSocket(wsUrl);
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    setWs(websocket);
    return () => websocket.close();
  }, [user]);

  const sendMessage = () => {
    if (!ws || !selectedUser || !messageInput.trim()) return;

    const message = {
      type: "message",
      senderId: user!.id,
      receiverId: selectedUser.id,
      content: messageInput.trim(),
    };

    ws.send(JSON.stringify(message));
    setMessageInput("");
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-12rem)]">
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {chatPartners.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedUser(contact)}
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
                    {contact.gamerType}
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        {selectedUser ? (
          <>
            <CardHeader className="border-b">
              <CardTitle>
                {selectedUser.displayName ?? selectedUser.username}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-full">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        message.senderId === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
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