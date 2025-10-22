import React from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCommunityTheme } from "../../utils/communityThemes";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  communities?: unknown[];
}

interface DeckmasterDashboardProps {
  user: User;
}

export function DeckmasterDashboard({ user }: DeckmasterDashboardProps) {
  const theme = getCommunityTheme("deckmaster");

  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950">
      {/* Clean Strategic Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/50 to-indigo-100/50 dark:from-slate-900/50 dark:to-indigo-900/50"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-full flex items-center justify-center">
                <i className="fas fa-chess text-white text-lg"></i>
              </div>
              <span
                className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-indigo-600 bg-clip-text text-transparent"
                style={{ fontFamily: theme.fonts.heading }}
              >
                Deckmaster
              </span>
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-slate-600 rounded-full flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-lg"></i>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <Avatar className="h-20 w-20 border-3 border-slate-300 dark:border-slate-700 shadow-lg">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback
                  className="text-xl font-bold bg-gradient-to-r from-slate-600 to-indigo-600 text-white"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1
                  className="text-4xl font-bold mb-2 text-slate-800 dark:text-slate-200"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  Welcome, {user.firstName || "Strategist"}
                </h1>
                <p
                  className="text-lg text-slate-600 dark:text-slate-300 mb-3"
                  style={{ fontFamily: theme.fonts.accent }}
                >
                  Ready to master the strategic arts?
                </p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-slate-600 to-indigo-500 text-white border-0 px-3 py-1">
                    <i className="fas fa-chess mr-1"></i>
                    Strategist
                  </Badge>
                  <Badge className="bg-gradient-to-r from-indigo-500 to-slate-600 text-white border-0 px-3 py-1">
                    <i className="fas fa-brain mr-1"></i>
                    Analyst
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Strategic Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/matchmaking">
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              data-testid="card-quick-match"
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-slate-600 to-indigo-600 flex items-center justify-center">
                  <i className="fas fa-brain text-white text-xl"></i>
                </div>
                <h3
                  className="font-semibold mb-2 text-lg text-slate-700 dark:text-slate-300"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {theme.terminology.quickMatch}
                </h3>
                <p
                  className="text-sm text-slate-600 dark:text-slate-400"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Strategic matchmaking
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              data-testid="card-tablesync"
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
                  <i className="fas fa-sync-alt text-white text-xl"></i>
                </div>
                <h3
                  className="font-semibold mb-2 text-lg text-slate-700 dark:text-slate-300"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  TableSync
                </h3>
                <p
                  className="text-sm text-slate-600 dark:text-slate-400"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Coordinate sessions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            data-testid="card-events"
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center">
                <i className="fas fa-calendar text-white text-xl"></i>
              </div>
              <h3
                className="font-semibold mb-2 text-lg text-slate-700 dark:text-slate-300"
                style={{ fontFamily: theme.fonts.heading }}
              >
                {theme.terminology.events}
              </h3>
              <p
                className="text-sm text-slate-600 dark:text-slate-400"
                style={{ fontFamily: theme.fonts.body }}
              >
                Strategic workshops
              </p>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            data-testid="card-analysis"
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
              <h3
                className="font-semibold mb-2 text-lg text-slate-700 dark:text-slate-300"
                style={{ fontFamily: theme.fonts.heading }}
              >
                Analysis Hub
              </h3>
              <p
                className="text-sm text-slate-600 dark:text-slate-400"
                style={{ fontFamily: theme.fonts.body }}
              >
                Meta insights
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Game Pod Calendar - TODO: Integrate with events feature */}
        <div className="mb-8">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Game Pod Calendar - Coming Soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Strategic Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card
            className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            data-testid="card-activity"
          >
            <CardHeader className="bg-gradient-to-r from-slate-600 to-indigo-600 text-white">
              <CardTitle
                className="flex items-center gap-3 text-xl"
                style={{ fontFamily: theme.fonts.heading }}
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white"></i>
                </div>
                {theme.terminology.notifications}
              </CardTitle>
              <CardDescription
                className="text-white/90"
                style={{ fontFamily: theme.fonts.body }}
              >
                Strategic insights and competitive intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-slate-600 to-indigo-600 flex items-center justify-center">
                    <i className="fas fa-chess text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-semibold text-slate-800 dark:text-slate-200"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Welcome to Deckmaster, {user.firstName || "Strategist"}!
                    </p>
                    <p
                      className="text-sm text-slate-600 dark:text-slate-400"
                      style={{ fontFamily: theme.fonts.body }}
                    >
                      Your strategic command center is ready. Master the meta
                      together.
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-indigo-500 to-slate-600 text-white border-0 text-sm px-3 py-1">
                    <i className="fas fa-star mr-1"></i>
                    NEW
                  </Badge>
                </div>

                <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
                    <i className="fas fa-brain text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-semibold text-indigo-800 dark:text-indigo-200"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Meta Analysis Available
                    </p>
                    <p
                      className="text-sm text-indigo-600 dark:text-indigo-400"
                      style={{ fontFamily: theme.fonts.body }}
                    >
                      New competitive insights on optimal deck construction
                      strategies
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs text-indigo-600 border-indigo-600"
                  >
                    4h ago
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Profile */}
          <Card
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            data-testid="card-profile"
          >
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-slate-600 text-white">
              <CardTitle
                className="flex items-center gap-3"
                style={{ fontFamily: theme.fonts.heading }}
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                Strategic Profile
              </CardTitle>
              <CardDescription
                className="text-white/90 text-sm"
                style={{ fontFamily: theme.fonts.body }}
              >
                Your mastery and analysis contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="fas fa-chess text-xl text-slate-600 dark:text-slate-400"></i>
                    <span
                      className="font-semibold text-slate-800 dark:text-slate-200"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Current Focus: Deckmaster
                    </span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Strategic Rank:
                      </span>
                      <Badge className="bg-gradient-to-r from-slate-600 to-indigo-600 text-white text-xs px-2 py-1">
                        Master
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Focus Areas:
                      </span>
                      <div className="flex gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs text-slate-600 border-slate-600"
                        >
                          Meta
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs text-indigo-600 border-indigo-600"
                        >
                          Theory
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Sessions Led:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        42
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Strategic Rating:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        1,347
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-slate-600 to-indigo-600 hover:from-slate-700 hover:to-indigo-700 text-white"
                  style={{ fontFamily: theme.fonts.heading }}
                  data-testid="button-strategy-session"
                >
                  <i className="fas fa-chess mr-2"></i>
                  Begin Strategy Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
