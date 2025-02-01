import { Card, CardContent } from "@/components/ui/card";
import { Users2, GamepadIcon, Headphones, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { HeroIllustration } from "@/components/hero-illustration";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12 relative">
      {/* Pixel Art Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-4 h-4 bg-primary/20 rotate-45" />
        <div className="absolute top-40 right-20 w-4 h-4 bg-primary/20 rotate-45" />
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-primary/20 rotate-45" />
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-primary/20 rotate-45" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="flex-1 text-center lg:text-left space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Connect and Empower Women Gamers
          </h1>
          <p className="text-xl text-muted-foreground">
            Join our vibrant community where women gamers unite, share experiences,
            and find their perfect gaming companions.
          </p>
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
        <div className="flex-1">
          <HeroIllustration />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20">
          <CardContent className="p-6 space-y-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users2 className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -right-1 -top-1" />
              </div>
            </div>
            <h3 className="text-lg font-semibold font-pixel">Quick Match</h3>
            <p className="text-muted-foreground">
              Find gaming friends who share your interests and play style.
            </p>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20">
          <CardContent className="p-6 space-y-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <GamepadIcon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -right-1 -top-1" />
              </div>
            </div>
            <h3 className="text-lg font-semibold font-pixel">Game Categories</h3>
            <p className="text-muted-foreground">
              From cozy games to FPS, find your perfect gaming niche.
            </p>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20">
          <CardContent className="p-6 space-y-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Headphones className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -right-1 -top-1" />
              </div>
            </div>
            <h3 className="text-lg font-semibold font-pixel">Voice Chat</h3>
            <p className="text-muted-foreground">
              Connect with voice chat in a safe, moderated environment.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pixel Art Footer Decoration */}
      <div className="flex justify-center gap-4 py-8">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="w-8 h-8 bg-primary/10 rotate-45 transform hover:scale-110 transition-transform"
          />
        ))}
      </div>
    </div>
  );
}