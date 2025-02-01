import { Card, CardContent } from "@/components/ui/card";
import { Users2, NewspaperIcon, UsersIcon, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { HeroIllustration } from "@/components/hero-illustration";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-16 relative">
      {/* Pixel Art Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-4 h-4 bg-primary/20 rotate-45" />
        <div className="absolute top-40 right-20 w-4 h-4 bg-primary/20 rotate-45" />
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-primary/20 rotate-45" />
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-primary/20 rotate-45" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 text-center lg:text-left space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Connect and Empower Women Gamers
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Join our vibrant community where women gamers unite, share experiences,
            and find their perfect gaming companions.
          </p>
          {!user ? (
            <Link href="/auth">
              <Button size="lg" className="px-8">
                Join Luminaras
              </Button>
            </Link>
          ) : (
            <Link href="/matches">
              <Button size="lg" className="px-8">
                Find Gaming Friends
              </Button>
            </Link>
          )}
        </div>
        <div className="flex-1">
          <HeroIllustration />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users2 className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -right-1 -top-1" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Quick Match</h3>
            <p className="text-muted-foreground leading-relaxed">
              Connect with fellow gamers who share your interests and play style. Our matching system helps you find the perfect gaming companions.
            </p>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <NewspaperIcon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -right-1 -top-1" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Gaming News</h3>
            <p className="text-muted-foreground leading-relaxed">
              Stay updated with the latest gaming news, upcoming releases, and community events. Never miss out on what's happening in the gaming world.
            </p>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <UsersIcon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -right-1 -top-1" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Gaming Groups</h3>
            <p className="text-muted-foreground leading-relaxed">
              Join or create gaming groups based on your favorite games. Build lasting friendships and find your gaming community.
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