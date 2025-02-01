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
import { Trophy, Music, Link as LinkIcon, Gamepad, Youtube } from "lucide-react";
import type { SelectUser } from "@db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: user } = useQuery<SelectUser>({
    queryKey: [`/api/users/${id}`],
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
            <div className="relative">
              <Avatar className="h-24 w-24 -mt-12 border-4 border-background">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback>
                  {user.displayName?.[0] ?? user.username[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Input
                  type="file"
                  className="hidden"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={(e) => {
                    // Handle file upload logic here
                  }}
                />
              )}
            </div>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData);
                    data.isContentCreator = formData.get('isContentCreator') === 'on';
                    updateProfileMutation.mutate(data);
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
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                  />

                  {/* Gaming Preferences */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gaming Level</label>
                    <Select name="gamingLevel" defaultValue={user.gamingLevel ?? "casual"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your gaming level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="competitive">Competitive</SelectItem>
                        <SelectItem value="profresh">Profresh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Game Interests */}
                  <Input
                    name="gameInterests"
                    defaultValue={user.gameInterests?.join(", ") ?? ""}
                    placeholder="Game interests (comma-separated)"
                  />

                  {/* Music Preferences */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Music Preferences</label>
                    <Input
                      name="spotifyLink"
                      defaultValue={user.spotifyLink ?? ""}
                      placeholder="Spotify Profile Link"
                    />
                    <Input
                      name="musicGenres"
                      defaultValue={user.musicGenres?.join(", ") ?? ""}
                      placeholder="Favorite music genres (comma-separated)"
                    />
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Social Media</label>
                    <Input
                      name="twitterLink"
                      defaultValue={user.twitterLink ?? ""}
                      placeholder="Twitter Profile"
                    />
                    <Input
                      name="instagramLink"
                      defaultValue={user.instagramLink ?? ""}
                      placeholder="Instagram Profile"
                    />
                    <Input
                      name="twitchLink"
                      defaultValue={user.twitchLink ?? ""}
                      placeholder="Twitch Channel"
                    />
                  </div>

                  {/* Content Creator Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isContentCreator"
                      name="isContentCreator"
                      defaultChecked={user.isContentCreator}
                    />
                    <label
                      htmlFor="isContentCreator"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I am a content creator
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save Changes</Button>
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
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {user.displayName ?? user.username}
                        {user.isContentCreator && (
                          <Badge variant="secondary" className="ml-2">
                            <Youtube className="h-3 w-3 mr-1" />
                            Content Creator
                          </Badge>
                        )}
                      </h2>
                      <p className="text-muted-foreground">{user.bio}</p>
                    </div>

                    {/* Gaming Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Gamepad className="h-4 w-4" />
                        Gaming
                      </h3>
                      <p className="text-sm">Level: {user.gamingLevel}</p>
                      <div className="flex flex-wrap gap-2">
                        {user.gameInterests?.map((game) => (
                          <Badge key={game} variant="secondary">
                            {game}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Music Section */}
                    {(user.spotifyLink || user.musicGenres?.length > 0) && (
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Music
                        </h3>
                        {user.musicGenres?.map((genre) => (
                          <Badge key={genre} variant="outline">
                            {genre}
                          </Badge>
                        ))}
                        {user.spotifyLink && (
                          <a
                            href={user.spotifyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block"
                          >
                            Spotify Profile
                          </a>
                        )}
                      </div>
                    )}

                    {/* Social Links */}
                    {(user.twitterLink || user.instagramLink || user.twitchLink) && (
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Social Links
                        </h3>
                        <div className="flex gap-4">
                          {user.twitterLink && (
                            <a
                              href={user.twitterLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Twitter
                            </a>
                          )}
                          {user.instagramLink && (
                            <a
                              href={user.instagramLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Instagram
                            </a>
                          )}
                          {user.twitchLink && (
                            <a
                              href={user.twitchLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Twitch
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {isOwnProfile && (
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}