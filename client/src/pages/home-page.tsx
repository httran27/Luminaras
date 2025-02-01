import { Card, CardContent } from "@/components/ui/card";
import { MoonIcon, Users2, Trophy, GamepadIcon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Connect and Empower Women Gamers
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Join our vibrant community where women gamers unite, share experiences,
          and find their perfect gaming companions.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6 space-y-2">
            <Users2 className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-semibold">Quick Match</h3>
            <p className="text-muted-foreground">
              Find gaming friends who share your interests and play style.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6 space-y-2">
            <GamepadIcon className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-semibold">Game Categories</h3>
            <p className="text-muted-foreground">
              From cozy games to FPS, find your perfect gaming niche.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6 space-y-2">
            <Trophy className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-semibold">Share Achievements</h3>
            <p className="text-muted-foreground">
              Celebrate your gaming victories with the community.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        {!user ? (
          <Link href="/auth">
            <a>
              <Button size="lg" className="px-8">
                Join Luminaras
              </Button>
            </a>
          </Link>
        ) : (
          <Link href="/matches">
            <a>
              <Button size="lg" className="px-8">
                Find Gaming Friends
              </Button>
            </a>
          </Link>
        )}
      </div>
    </div>
  );
}
