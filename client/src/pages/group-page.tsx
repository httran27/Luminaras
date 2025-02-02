import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Users, Trash2, MoreVertical, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectGroup, SelectUser } from "@db/schema";

interface GroupMessage {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

interface GroupWithMembers extends SelectGroup {
  members: (SelectUser & { role: string })[];
}

export default function GroupPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: group } = useQuery<GroupWithMembers>({
    queryKey: [`/api/groups/${id}`],
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<GroupMessage[]>({
    queryKey: [`/api/groups/${id}/messages`],
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Group deleted",
        description: "The group has been successfully deleted.",
      });
      setLocation("/groups");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

    const joinGroupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/groups/${id}/join`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${id}`] });
      toast({
        title: "Joined group",
        description: "You are now a member of this group.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/groups/${id}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      refetchMessages();
      setMessageInput("");
    },
  });

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
    if (window.confirm("Are you sure you want to report this message?")) {
      reportMessageMutation.mutate({
        messageId,
        reason: "Inappropriate content", // You could add a reason selection dialog here
      });
    }
  };

  useEffect(() => {
    if (!user || !id) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      window.location.host
    }/ws/groups/${id}?userId=${user.id}`;

    const websocket = new WebSocket(wsUrl);
    websocket.onmessage = () => {
      refetchMessages();
    };

    setWs(websocket);
    return () => websocket.close();
  }, [user, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!group) return null;

  const isAdmin = group.members.some(
    (member) => member.id === user?.id && member.role === "admin"
  );

  const isMember = group.members.some(
    (member) => member.id === user?.id
  );

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-6">
      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </div>
            {isAdmin ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
                    deleteGroupMutation.mutate();
                  }
                }}
                disabled={deleteGroupMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            ) : !isMember && (
              <Button
                onClick={() => joinGroupMutation.mutate()}
                disabled={joinGroupMutation.isPending}
              >
                {joinGroupMutation.isPending ? (
                  "Joining..."
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Join Group
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[calc(100vh-16rem)]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 items-start ${
                    message.sender.id === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender.id !== user?.id && (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender.avatar || undefined} />
                        <AvatarFallback>
                          {message.sender.displayName?.[0] ?? message.sender.username[0]}
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
                      message.sender.id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.sender.id !== user?.id && (
                      <div className="text-xs font-medium mb-1">
                        {message.sender.displayName ?? message.sender.username}
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (messageInput.trim()) {
                  sendMessageMutation.mutate(messageInput.trim());
                }
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({group.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="p-4 flex items-center gap-3 hover:bg-muted/50"
              >
                <Avatar>
                  <AvatarImage src={member.avatar || undefined} />
                  <AvatarFallback>
                    {member.displayName?.[0] ?? member.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {member.displayName ?? member.username}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}