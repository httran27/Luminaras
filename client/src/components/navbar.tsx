import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import debounce from "lodash/debounce";
import type { SelectUser } from "@db/schema";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handler = debounce((value: string) => {
      setDebouncedSearch(value);
    }, 300);

    handler(search);
    return () => handler.cancel();
  }, [search]);

  const { data: searchResults = [], isLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/users/search", { q: debouncedSearch }],
    enabled: debouncedSearch.length > 2,
  });

  const handleSearchSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.length >= 3) {
      try {
        if (searchResults && searchResults.length > 0) {
          setLocation(`/profile/${searchResults[0].id}`);
          setSearch('');
        } else {
          toast({
            title: "No users found",
            description: `No users found matching "${search}"`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Search failed",
          description: "An error occurred while searching for users.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link href="/">
          <a className="mr-8">
            <Logo />
          </a>
        </Link>

        <div className="flex gap-6 flex-1">
          {user && (
            <>
              <Link href="/matches">
                <a className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === "/matches" ? "text-primary" : ""
                }`}>
                  Quick Match
                </a>
              </Link>
              <Link href="/messages">
                <a className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === "/messages" ? "text-primary" : ""
                }`}>
                  Messages
                </a>
              </Link>
              <Link href="/groups">
                <a className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === "/groups" ? "text-primary" : ""
                }`}>
                  Groups
                </a>
              </Link>
              <Link href="/news">
                <a className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === "/news" ? "text-primary" : ""
                }`}>
                  News
                </a>
              </Link>
            </>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                className="w-60"
                placeholder="Search users... (min. 3 characters)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchSubmit}
              />
              {searchResults.length > 0 && search.length >= 3 && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-50">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-2 hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setLocation(`/profile/${result.id}`);
                        setSearch('');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={result.avatar || undefined} />
                          <AvatarFallback>
                            {result.displayName?.[0] ?? result.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {result.displayName ?? result.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.gamerType || 'Gamer'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 ml-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-10 h-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>
                      {user.displayName?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/profile/${user.id}`}>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-red-600 focus:text-red-600"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}