import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { SelectUser } from "@db/schema";

interface MatchCardProps {
  user: SelectUser;
  onSwipe: (direction: "left" | "right") => void;
}

export function MatchCard({ user, onSwipe }: MatchCardProps) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = Math.abs(velocity.x) * offset.x;
        if (swipe < -20) onSwipe("left");
        else if (swipe > 20) onSwipe("right");
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="w-80 bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {user.displayName?.[0] ?? user.username[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold">{user.displayName ?? user.username}</h3>
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {user.gameInterests?.map((game) => (
                <Badge key={game} variant="secondary">
                  {game}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="destructive"
                onClick={() => onSwipe("left")}
              >
                Pass
              </Button>
              <Button 
                onClick={() => onSwipe("right")}
              >
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
