import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Trophy } from "lucide-react";
import type { SelectUser } from "@db/schema";

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: user } = useQuery<SelectUser>({
    queryKey: [`/api/users/${id}`],
  });

  const { data: achievements } = useQuery({
    queryKey: [`/api/achievements/${id}`],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<SelectUser>) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    },
  });

  if (!user) return null;
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="relative">
        {user.background && (
          <div
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${user.background})` }}
          />
        )}
        
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar className="h-24 w-24 -mt-12 border-4 border-background">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback>
                {user.displayName?.[0] ?? user.username[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    updateProfileMutation.mutate(Object.fromEntries(formData));
                  }}
                  className="space-y-4"
                >
                  <Input
                    name="displayName"
                    defaultValue={user.displayName ?? ""}
                    placeholder="Display Name"
                  />
                  <Textarea
                    name="bio"
                    defaultValue={user.bio ?? ""}
                    placeholder="Bio"
                  />
                  <Input
                    name="avatar"
                    defaultValue={user.avatar ?? ""}
                    placeholder="Avatar URL"
                  />
                  <Input
                    name="background"
                    defaultValue={user.background ?? ""}
                    placeholder="Background URL"
                  />
                  <div className="flex gap-2">
                    <Button type="submit">Save</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {user.displayName ?? user.username}
                    </h2>
                    <p className="text-muted-foreground">{user.bio}</p>
                  </div>
                  {isOwnProfile && (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Gaming Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.gameInterests?.map((game) => (
                <Badge key={game} variant="secondary">
                  {game}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {achievements?.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
            >
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <h4 className="font-semibold">{achievement.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  {achievement.game}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}