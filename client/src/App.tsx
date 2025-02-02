import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ProfilePage from "@/pages/profile-page";
import MatchesPage from "@/pages/matches-page";
import NewsPage from "@/pages/news-page";
import GroupsPage from "@/pages/groups-page";
import GroupPage from "@/pages/group-page";
import MessagesPage from "@/pages/messages-page";
import Navbar from "@/components/navbar";
import { ChatPopup } from "@/components/chat-popup";

function Router() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/profile/:id">
            {(params) => <ProtectedRoute component={ProfilePage} params={params} />}
          </Route>
          <Route path="/matches">
            {() => <ProtectedRoute component={MatchesPage} />}
          </Route>
          <Route path="/messages">
            {() => <ProtectedRoute component={MessagesPage} />}
          </Route>
          <Route path="/groups">
            {() => <ProtectedRoute component={GroupsPage} />}
          </Route>
          <Route path="/groups/:id">
            {(params) => <ProtectedRoute component={GroupPage} params={params} />}
          </Route>
          <Route path="/news">
            {() => <ProtectedRoute component={NewsPage} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <ChatPopup />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;