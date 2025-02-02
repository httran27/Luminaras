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
import { useState, useRef } from "react";
import { Trophy, Music, Link as LinkIcon, Gamepad, Youtube, Camera } from "lucide-react";
import type { SelectUser } from "@db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  gamingLevel?: string;
  gameInterests?: string[];
  musicGenres?: string[];
  isContentCreator?: boolean;
  socialLinks?: {
    twitter?: string;
    twitch?: string;
    discord?: string;
    instagram?: string;
    spotify?: string;
  };
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user } = useQuery<SelectUser>({
    queryKey: [`/api/users/${id}`],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
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

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`/api/users/${id}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to upload avatar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
  });

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
  };

  if (!user) return null;
  const isOwnProfile = currentUser?.id === user.id;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UpdateProfileData = {
      displayName: formData.get('displayName') as string || undefined,
      bio: formData.get('bio') as string || undefined,
      gamingLevel: formData.get('gamingLevel') as string || undefined,
      gameInterests: formData.get('gameInterests')?.toString().split(',').map(s => s.trim()) || undefined,
      musicGenres: formData.get('musicGenres')?.toString().split(',').map(s => s.trim()) || undefined,
      isContentCreator: formData.get('isContentCreator') === 'on',
      socialLinks: {
        twitter: formData.get('twitterLink') as string || undefined,
        twitch: formData.get('twitchLink') as string || undefined,
        instagram: formData.get('instagramLink') as string || undefined,
        spotify: formData.get('spotifyLink') as string || undefined,
      }
    };
    updateProfileMutation.mutate(data);
  };

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
              <Avatar 
                className={`h-24 w-24 -mt-12 border-4 border-background ${isOwnProfile ? 'cursor-pointer hover:opacity-90' : ''}`}
                onClick={handleAvatarClick}
              >
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback>
                  {user.displayName?.[0] ?? user.username[0]}
                </AvatarFallback>
                {isOwnProfile && (
                  <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1">
                    <Camera className="h-4 w-4" />
                  </div>
                )}
              </Avatar>
              {isOwnProfile && (
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadAvatarMutation.isPending}
                />
              )}
            </div>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <Input
                    name="gameInterests"
                    defaultValue={user.gameInterests?.join(", ") ?? ""}
                    placeholder="Game interests (comma-separated)"
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Music Preferences</label>
                    <Input
                      name="spotifyLink"
                      defaultValue={user.socialLinks?.spotify ?? ""}
                      placeholder="Spotify Profile Link"
                    />
                    <Input
                      name="musicGenres"
                      defaultValue={user.musicGenres?.join(", ") ?? ""}
                      placeholder="Favorite music genres (comma-separated)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Social Media</label>
                    <Input
                      name="twitterLink"
                      defaultValue={user.socialLinks?.twitter ?? ""}
                      placeholder="Twitter Profile"
                    />
                    <Input
                      name="instagramLink"
                      defaultValue={user.socialLinks?.instagram ?? ""}
                      placeholder="Instagram Profile"
                    />
                    <Input
                      name="twitchLink"
                      defaultValue={user.socialLinks?.twitch ?? ""}
                      placeholder="Twitch Channel"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isContentCreator"
                      name="isContentCreator"
                      defaultChecked={user.isContentCreator || false}
                    />
                    <label
                      htmlFor="isContentCreator"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I am a content creator
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      Save Changes
                    </Button>
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

                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Gamepad className="h-4 w-4" />
                        Gaming
                      </h3>
                      <p className="text-sm">Level: {user.gamingLevel || "Not specified"}</p>
                      <div className="flex flex-wrap gap-2">
                        {user.gameInterests?.map((game) => (
                          <Badge key={game} variant="secondary">
                            {game}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {(user.socialLinks?.spotify || (user.musicGenres && user.musicGenres.length > 0)) && (
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
                        {user.socialLinks?.spotify && (
                          <a
                            href={user.socialLinks.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block"
                          >
                            Spotify Profile
                          </a>
                        )}
                      </div>
                    )}

                    {(user.socialLinks?.twitter || user.socialLinks?.instagram || user.socialLinks?.twitch) && (
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Social Links
                        </h3>
                        <div className="flex gap-4">
                          {user.socialLinks.twitter && (
                            <a
                              href={user.socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Twitter
                            </a>
                          )}
                          {user.socialLinks.instagram && (
                            <a
                              href={user.socialLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Instagram
                            </a>
                          )}
                          {user.socialLinks.twitch && (
                            <a
                              href={user.socialLinks.twitch}
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