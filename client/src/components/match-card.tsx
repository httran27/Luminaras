import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <div className="flex justify-center w-full">
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
        className="absolute left-1/2 -translate-x-1/2 w-[400px] perspective-1000"
        whileTap={{ cursor: "grabbing" }}
        initial={{ scale: 1 }}
        whileDrag={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.5
        }}
      >
        <div
          className={`transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of card */}
          <Card className="w-full bg-card backface-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-6">
                <Avatar className="h-32 w-32 border-2 border-primary/20">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>
                    {user.displayName?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-semibold">
                    {user.displayName ?? user.username}
                  </h3>
                  {user.gamerType && (
                    <Badge variant="secondary" className="text-base px-4 py-1">
                      <Gamepad className="w-4 h-4 mr-2" />
                      {user.gamerType}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {user.gameInterests?.map((game) => (
                    <Badge key={game} variant="outline" className="text-sm">
                      {game}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back of card */}
          <Card className="w-full bg-card backface-hidden absolute inset-0 rotate-y-180">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Gamepad className="h-5 w-5" />
                      Gaming Preferences
                    </h3>
                    <p className="text-base text-muted-foreground">
                      Level: {user.gamingLevel || "Not specified"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.gameInterests?.map((game) => (
                        <Badge key={game} variant="outline" className="text-sm">
                          {game}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {user.musicGenres && user.musicGenres.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Music Preferences
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {user.musicGenres.map((genre) => (
                          <Badge key={genre} variant="outline" className="text-sm">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Bio
                    </h3>
                    <p className="text-base text-muted-foreground">
                      {user.bio || "No bio available"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 pt-6 mt-4 justify-center">
        </div>
      </motion.div>
    </div>
  );
}