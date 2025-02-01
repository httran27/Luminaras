import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Logo } from "@/components/logo";

const formSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="container mx-auto grid lg:grid-cols-2 gap-8 items-center min-h-screen px-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Luminaras</CardTitle>
          <CardDescription>
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                loginMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={registerMutation.isPending}
                  onClick={() => {
                    const values = form.getValues();
                    registerMutation.mutate(values);
                  }}
                >
                  Register
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="text-center lg:text-left space-y-6">
        <Logo />
        <h1 className="text-4xl font-bold tracking-tight">
          Connect and Empower Women Gamers
        </h1>
        <p className="text-xl text-muted-foreground">
          Join our community of passionate gamers. Find friends, share achievements,
          and game together in a supportive environment.
        </p>
      </div>
    </div>
  );
}
