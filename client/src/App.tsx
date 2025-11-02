import { QueryClientProvider } from "@tanstack/react-query";
import React, { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommunityProvider } from "@/features/communities";
import {
  ErrorBoundary,
  AsyncErrorHandler,
} from "@/shared/components/ErrorBoundaries";
import { queryClient } from "./lib/queryClient";

// Loading component for lazy routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load all pages for better code splitting
const Landing = lazy(() => import("@/pages/landing"));
const Home = lazy(() => import("@/pages/home"));
const TableSync = lazy(() => import("@/pages/tablesync"));
const TableSyncLanding = lazy(() => import("@/pages/tablesync-landing"));
const GameRoom = lazy(() => import("@/pages/game-room"));
const Social = lazy(() =>
  import("@/features/users").then((m) => ({ default: m.Social })),
);
const Profile = lazy(() =>
  import("@/features/users").then((m) => ({ default: m.Profile })),
);
const CollaborativeStreamingDashboard = lazy(() =>
  import("@/features/collaborative-streaming").then((m) => ({
    default: m.CollaborativeStreamingDashboard,
  })),
);
const Calendar = lazy(() => import("@/pages/calendar"));
const Matchmaking = lazy(() => import("@/pages/matchmaking"));
const Tournaments = lazy(() => import("@/pages/tournaments"));
const TournamentDetail = lazy(() => import("@/pages/tournament-detail"));
const NotFound = lazy(() => import("@/pages/not-found"));
const HelpCenter = lazy(() => import("@/pages/help-center"));
const GettingStarted = lazy(() => import("@/pages/getting-started"));
const FAQ = lazy(() => import("@/pages/faq"));
const APIDocs = lazy(() => import("@/pages/api-docs"));
const CommunityForum = lazy(() => import("@/pages/community-forum"));
const Contact = lazy(() => import("@/pages/contact"));
const Terms = lazy(() => import("@/pages/terms"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Conduct = lazy(() => import("@/pages/conduct"));
const VideoRoom = lazy(() => import("@/pages/video-room"));
const SignIn = lazy(() => import("@/pages/auth/signin"));
const Register = lazy(() => import("@/pages/auth/register"));
const VerifyEmail = lazy(() => import("@/pages/auth/verify-email"));
const ChangeEmail = lazy(() => import("@/pages/auth/change-email"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const MfaVerify = lazy(() => import("@/pages/auth/mfa-verify"));
const AccountSettings = lazy(() => import("@/pages/auth/account-settings"));
const AuthError = lazy(() => import("@/pages/auth/error"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes - always available */}
        <Route path="/" component={Landing} />
        <Route path="/tablesync" component={TableSyncLanding} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/tournaments" component={Tournaments} />
        <Route path="/tournaments/:id" component={TournamentDetail} />
        <Route path="/help-center" component={HelpCenter} />
        <Route path="/getting-started" component={GettingStarted} />
        <Route path="/faq" component={FAQ} />
        <Route path="/api-docs" component={APIDocs} />
        <Route path="/community-forum" component={CommunityForum} />
        <Route path="/contact" component={Contact} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/conduct" component={Conduct} />

        {/* Auth routes */}
        <Route path="/auth/signin" component={SignIn} />
        <Route path="/auth/register" component={Register} />
        <Route path="/auth/verify-email" component={VerifyEmail} />
        <Route path="/auth/change-email" component={ChangeEmail} />
        <Route path="/auth/forgot-password" component={ForgotPassword} />
        <Route path="/auth/mfa-verify" component={MfaVerify} />
        <Route path="/auth/error" component={AuthError} />

        {/* Redirect /login to /auth/signin for compatibility */}
        <Route path="/login" component={SignIn} />

        {/* Protected routes - require authentication */}
        <Route path="/home">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <Home />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/app">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <TableSync />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/app/room/:id">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <GameRoom />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/social">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <Social />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/matchmaking">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <Matchmaking />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/profile">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <Profile />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/profile/:userId">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <Profile />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/account/settings">
          <RequireAuth redirectTo="/auth/signin">
            <ErrorBoundary level="feature">
              <AccountSettings />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/collaborative-streaming">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <CollaborativeStreamingDashboard />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/video-room">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <VideoRoom />
            </ErrorBoundary>
          </RequireAuth>
        </Route>
        <Route path="/video-room/:roomId">
          <RequireAuth redirectTo="/">
            <ErrorBoundary level="feature">
              <VideoRoom />
            </ErrorBoundary>
          </RequireAuth>
        </Route>

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary level="page">
      <AsyncErrorHandler>
        <QueryClientProvider client={queryClient}>
          <CommunityProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CommunityProvider>
        </QueryClientProvider>
      </AsyncErrorHandler>
    </ErrorBoundary>
  );
}

export default App;
