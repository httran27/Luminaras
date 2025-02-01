import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link href="/">
          <a className="mr-8">
            <Logo />
          </a>
        </Link>
        
        <div className="flex gap-6 flex-1">
          <Link href="/matches">
            <a className="text-sm font-medium transition-colors hover:text-primary">
              Quick Match
            </a>
          </Link>
          <Link href="/messages">
            <a className="text-sm font-medium transition-colors hover:text-primary">
              Messages
            </a>
          </Link>
          <Link href="/news">
            <a className="text-sm font-medium transition-colors hover:text-primary">
              News
            </a>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href={`/profile/${user.id}`}>
            <a className="text-sm font-medium transition-colors hover:text-primary">
              Profile
            </a>
          </Link>
          <Button 
            variant="ghost" 
            onClick={() => logoutMutation.mutate()}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
