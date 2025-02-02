import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { SelectUser } from "@db/schema";
import { Gamepad, Music, Users } from "lucide-react";
import { useState } from "react";

interface MatchCardProps {
  user: SelectUser;
  onSwipe: (direction: "left" | "right") => void;
}

export function MatchCard({ user, onSwipe }: MatchCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5]
  );

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: -1000, right: 1000 }}
      onDragEnd={(event, { offset, velocity }) => {
        const swipe = offset.x + velocity.x;
        if (Math.abs(swipe) > 100) {
          onSwipe(swipe > 0 ? "right" : "left");
        }
      }}
      className="cursor-grab active:cursor-grabbing absolute w-full [perspective:1000px]"
      whileTap={{ cursor: "grabbing" }}
      initial={{ scale: 1 }}
      whileDrag={{ scale: 1.05 }}
      animate={{ scale: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        mass: 0.5
      }}
    >
      <Card 
        className={`w-80 bg-card mx-auto transition-all duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <CardContent className="p-6 absolute w-full h-full [backface-visibility:hidden]">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback>
                {user.displayName?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">
                {user.displayName ?? user.username}
              </h3>
              {user.gamerType && (
                <Badge variant="secondary" className="mb-2">
                  <Gamepad className="w-3 h-3 mr-1" />
                  {user.gamerType}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {user.gameInterests?.map((game) => (
                <Badge key={game} variant="outline">
                  {game}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Back of card */}
        <CardContent className="p-6 absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Gamepad className="h-4 w-4" />
                Gaming Preferences
              </h3>
              <p className="text-sm text-muted-foreground">
                Level: {user.gamingLevel || "Not specified"}
              </p>
              <div className="flex flex-wrap gap-1">
                {user.gameInterests?.map((game) => (
                  <Badge key={game} variant="outline" className="text-xs">
                    {game}
                  </Badge>
                ))}
              </div>
            </div>

            {user.musicGenres && user.musicGenres.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Music Preferences
                </h3>
                <div className="flex flex-wrap gap-1">
                  {user.musicGenres.map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bio
              </h3>
              <p className="text-sm text-muted-foreground">
                {user.bio || "No bio available"}
              </p>
            </div>
          </div>
        </CardContent>

        {/* Action buttons */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-2">
          <Button 
            variant="destructive"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              onSwipe("left");
            }}
            className="shadow-lg hover:shadow-xl transition-shadow flex-1"
          >
            Pass
          </Button>
          <Button 
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              onSwipe("right");
            }}
            className="shadow-lg hover:shadow-xl transition-shadow flex-1"
          >
            Connect
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}