import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SelectUser } from "@db/schema";

interface UserSelectDialogProps {
  trigger: React.ReactNode;
  onSelect: (user: SelectUser) => void;
  excludeUserIds?: number[];
  title?: string;
}

export function UserSelectDialog({ 
  trigger, 
  onSelect, 
  excludeUserIds = [], 
  title = "Select User" 
}: UserSelectDialogProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: users = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users.filter(user => 
    !excludeUserIds.includes(user.id) &&
    (user.username.toLowerCase().includes(search.toLowerCase()) ||
     user.displayName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  className="w-full p-2 flex items-center gap-3 hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => {
                    onSelect(user);
                    setOpen(false);
                  }}
                >
                  <Avatar>
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>
                      {user.displayName?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">
                      {user.displayName ?? user.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.gamerType || 'Gamer'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}