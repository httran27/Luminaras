import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MatchCard } from "@/components/match-card";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectUser } from "@db/schema";

export default function MatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: potentialMatches, isLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/matches/potential"],
  });

  const createMatchMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", "/api/matches", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });

      toast({
        title: "Match Found! 🎮",
        description: "You can now chat with your new gaming friend in the Messages tab!",
        duration: 5000,
      });
    },
  });

  const handleSwipe = (direction: "left" | "right", userId: number) => {
    if (direction === "right") {
      createMatchMutation.mutate(userId);
    }
    // For both directions, we remove the current user and show the next one
    queryClient.setQueryData<SelectUser[]>(
      ["/api/matches/potential"],
      (old) => old?.filter((u) => u.id !== userId) ?? []
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!potentialMatches?.length) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No More Matches</h2>
          <p className="text-muted-foreground">
            Check back later for more potential gaming friends!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Only show the first potential match
  const currentMatch = potentialMatches[0];

  return (
    <div className="container max-w-6xl mx-auto flex flex-col items-center gap-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Quick Match</h1>
        <p className="text-muted-foreground">
          Tap card to see more info, swipe right to connect, left to pass
        </p>
      </div>

      <div className="flex justify-center">
        <MatchCard
          key={currentMatch.id}
          user={currentMatch}
          onSwipe={(direction) => handleSwipe(direction, currentMatch.id)}
        />
      </div>
    </div>
  );
}