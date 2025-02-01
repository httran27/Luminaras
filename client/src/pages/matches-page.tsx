import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MatchCard } from "@/components/match-card";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { SelectUser } from "@db/schema";

export default function MatchesPage() {
  const { user } = useAuth();

  const { data: potentialMatches, isLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/matches/potential"],
  });

  const createMatchMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("POST", "/api/matches", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  const handleSwipe = (direction: "left" | "right", userId: number) => {
    if (direction === "right") {
      createMatchMutation.mutate(userId);
    }
    // For both directions, we remove the user from potential matches
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

  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Quick Match</h1>
        <p className="text-muted-foreground">
          Swipe right to connect, left to pass
        </p>
      </div>

      <div className="relative w-full">
        {potentialMatches.map((match, index) => (
          <div
            key={match.id}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              zIndex: potentialMatches.length - index,
            }}
          >
            <MatchCard
              user={match}
              onSwipe={(direction) => handleSwipe(direction, match.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
