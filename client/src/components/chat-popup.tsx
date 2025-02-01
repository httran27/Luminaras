import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send } from "lucide-react";

export function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Placeholder data - will be replaced with actual data from backend
  const conversations = [
    { id: '1', username: 'Player1', lastMessage: 'Hey! Want to play together?' },
    { id: '2', username: 'Player2', lastMessage: 'GG!' },
  ];

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
                    onClick={() => setActiveChat(null)}
                  >
                    Back
                  </Button>
                  <span className="font-medium">Chat with {activeChat}</span>
                </div>
                <div className="flex-1 p-3">
                  {/* Chat messages will go here */}
                </div>
                <div className="p-3 border-t">
                  <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-3">
                {conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant="ghost"
                    className="w-full justify-start mb-2"
                    onClick={() => setActiveChat(conv.username)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{conv.username}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </div>
                    </div>
                  </Button>
                ))}
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
