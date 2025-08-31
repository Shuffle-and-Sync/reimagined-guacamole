import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommunityProvider } from "@/contexts/CommunityContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import TableSync from "@/pages/tablesync";
import Social from "@/pages/social";
import Calendar from "@/pages/calendar";
import Matchmaking from "@/pages/matchmaking";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/tablesync" component={TableSync} />
          <Route path="/social" component={Social} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/matchmaking" component={Matchmaking} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:userId" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CommunityProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CommunityProvider>
    </QueryClientProvider>
  );
}

export default App;
