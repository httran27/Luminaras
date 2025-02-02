import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { SelectGroup, SelectUser } from "@db/schema";
import { UserSelectDialog } from "@/components/user-select-dialog";

interface Group extends SelectGroup {
  memberCount: number;
}

export default function GroupsPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<SelectUser[]>([]);

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        gameCategory: formData.get('gameCategory') as string,
        initialMembers: selectedMembers.map(m => m.id)
      };
      const res = await apiRequest("POST", "/api/groups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreating(false);
      setSelectedMembers([]);
      toast({
        title: "Group created",
        description: "Your new group has been created successfully.",
      });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gaming Communities</h1>
          <p className="text-muted-foreground">
            Join or create gaming communities
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Group
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
            <CardDescription>
              Create a new gaming community for like-minded players
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createGroupMutation.mutate(new FormData(e.currentTarget));
            }}
          >
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea name="description" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Game Category</label>
                <Input name="gameCategory" placeholder="e.g., RPG, FPS, etc." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Members</label>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <Badge key={member.id} variant="secondary">
                      {member.displayName ?? member.username}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setSelectedMembers(prev => prev.filter(m => m.id !== member.id))}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <UserSelectDialog
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Members
                      </Button>
                    }
                    title="Add Group Members"
                    onSelect={(user) => {
                      if (!selectedMembers.some(m => m.id === user.id)) {
                        setSelectedMembers(prev => [...prev, user]);
                      }
                    }}
                    excludeUserIds={selectedMembers.map(m => m.id)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                type="submit"
                disabled={createGroupMutation.isPending}
              >
                Create Group
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setSelectedMembers([]);
                }}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups?.map((group) => (
          <Link key={group.id} href={`/groups/${group.id}`}>
            <a className="block">
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {group.name}
                    <Badge variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      {group.memberCount}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {group.gameCategory && (
                    <Badge>{group.gameCategory}</Badge>
                  )}
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}