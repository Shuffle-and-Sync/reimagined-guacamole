import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommunityProvider } from "@/features/communities";
import { RequireAuth } from "@/components/RequireAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import TableSync from "@/pages/tablesync";
import TableSyncLanding from "@/pages/tablesync-landing";
import GameRoom from "@/pages/game-room";
import { Social, Profile } from "@/features/users";
import Calendar from "@/pages/calendar";
import Matchmaking from "@/pages/matchmaking";
import Tournaments from "@/pages/tournaments";
import NotFound from "@/pages/not-found";
import HelpCenter from "@/pages/help-center";
import GettingStarted from "@/pages/getting-started";
import FAQ from "@/pages/faq";
import APIDocs from "@/pages/api-docs";
import CommunityForum from "@/pages/community-forum";
import Contact from "@/pages/contact";

function Router() {
  return (
    <Switch>
      {/* Public routes - always available */}
      <Route path="/" component={Landing} />
      <Route path="/tablesync" component={TableSyncLanding} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/getting-started" component={GettingStarted} />
      <Route path="/faq" component={FAQ} />
      <Route path="/api-docs" component={APIDocs} />
      <Route path="/community-forum" component={CommunityForum} />
      <Route path="/contact" component={Contact} />
      
      {/* Protected routes - require authentication */}
      <Route path="/home">
        <RequireAuth redirectTo="/">
          <Home />
        </RequireAuth>
      </Route>
      <Route path="/app">
        <RequireAuth redirectTo="/">
          <TableSync />
        </RequireAuth>
      </Route>
      <Route path="/app/room/:id">
        <RequireAuth redirectTo="/">
          <GameRoom />
        </RequireAuth>
      </Route>
      <Route path="/social">
        <RequireAuth redirectTo="/">
          <Social />
        </RequireAuth>
      </Route>
      <Route path="/matchmaking">
        <RequireAuth redirectTo="/">
          <Matchmaking />
        </RequireAuth>
      </Route>
      <Route path="/tournaments">
        <RequireAuth redirectTo="/">
          <Tournaments />
        </RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth redirectTo="/">
          <Profile />
        </RequireAuth>
      </Route>
      <Route path="/profile/:userId">
        <RequireAuth redirectTo="/">
          <Profile />
        </RequireAuth>
      </Route>
      
      {/* Fallback */}
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
