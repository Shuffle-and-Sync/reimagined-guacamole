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
import TableSyncLanding from "@/pages/tablesync-landing";
import GameRoom from "@/pages/game-room";
import Social from "@/pages/social";
import Calendar from "@/pages/calendar";
import Matchmaking from "@/pages/matchmaking";
import Tournaments from "@/pages/tournaments";
import Analytics from "@/pages/analytics";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import HelpCenter from "@/pages/help-center";
import GettingStarted from "@/pages/getting-started";
import FAQ from "@/pages/faq";
import APIDocs from "@/pages/api-docs";
import CommunityForum from "@/pages/community-forum";
import Contact from "@/pages/contact";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/tablesync" component={TableSyncLanding} />
          {/* Footer pages accessible to all users */}
          <Route path="/help-center" component={HelpCenter} />
          <Route path="/getting-started" component={GettingStarted} />
          <Route path="/faq" component={FAQ} />
          <Route path="/api-docs" component={APIDocs} />
          <Route path="/community-forum" component={CommunityForum} />
          <Route path="/contact" component={Contact} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/tablesync" component={TableSync} />
          <Route path="/tablesync/room/:id" component={GameRoom} />
          <Route path="/social" component={Social} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/matchmaking" component={Matchmaking} />
          <Route path="/tournaments" component={Tournaments} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:userId" component={Profile} />
          {/* Footer pages accessible to all users */}
          <Route path="/help-center" component={HelpCenter} />
          <Route path="/getting-started" component={GettingStarted} />
          <Route path="/faq" component={FAQ} />
          <Route path="/api-docs" component={APIDocs} />
          <Route path="/community-forum" component={CommunityForum} />
          <Route path="/contact" component={Contact} />
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
