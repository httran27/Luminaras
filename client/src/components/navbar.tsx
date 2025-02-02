import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { User, MessageSquare, Search, Users } from "lucide-react";
import debounce from "lodash/debounce";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = debounce((value: string) => {
      setDebouncedSearch(value);
    }, 300);

    handler(search);
    return () => handler.cancel();
  }, [search]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/users/search", { q: debouncedSearch }],
    enabled: debouncedSearch.length > 2 && open,
  });

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
            <Button
              variant="outline"
              className="relative h-9 w-9 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
              onClick={() => setOpen(true)}
            >
              <Search className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline-flex">Search users...</span>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
              <CommandInput 
                placeholder="Search users... (min. 3 characters)"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup heading="Search Results">
                      {searchResults?.map((result) => (
                        <CommandItem
                          key={result.id}
                          className="flex flex-col items-start p-4"
                        >
                          <div className="flex items-center w-full">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={result.avatar} />
                              <AvatarFallback>
                                {result.displayName?.[0] ?? result.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {result.displayName ?? result.username}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {result.gamerType || 'Gamer'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 w-full">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setOpen(false);
                                setLocation(`/profile/${result.id}`);
                              }}
                            >
                              <User className="h-4 w-4 mr-2" />
                              View Profile
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setOpen(false);
                                setLocation(`/messages`);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setOpen(false);
                                setLocation(`/groups`);
                              }}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Invite
                            </Button>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </CommandDialog>
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