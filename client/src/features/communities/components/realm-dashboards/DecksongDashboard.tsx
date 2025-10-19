import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { getCommunityTheme } from "../../utils/communityThemes";
import { GamePodCalendar } from "../GamePodCalendar";
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  communities?: any[];
}

interface DecksongDashboardProps {
  user: User;
}

export function DecksongDashboard({ user }: DecksongDashboardProps) {
  const theme = getCommunityTheme("decksong");

  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      {/* Elegant Disney Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/50 to-pink-100/50 dark:from-purple-900/50 dark:to-pink-900/50"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-purple-200 dark:border-purple-800 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full flex items-center justify-center">
                <i className="fas fa-crown text-white text-lg"></i>
              </div>
              <span
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"
                style={{ fontFamily: theme.fonts.heading }}
              >
                Decksong
              </span>
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-sparkles text-white text-lg"></i>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <Avatar className="h-20 w-20 border-3 border-purple-300 dark:border-purple-700 shadow-lg">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback
                  className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-white"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1
                  className="text-4xl font-bold mb-2 text-purple-800 dark:text-purple-200"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  Welcome, {user.firstName || "Storyteller"}
                </h1>
                <p
                  className="text-lg text-purple-600 dark:text-purple-300 mb-3"
                  style={{ fontFamily: theme.fonts.accent }}
                >
                  Ready to weave enchanting tales?
                </p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-400 text-white border-0 px-3 py-1">
                    <i className="fas fa-feather mr-1"></i>
                    Storyteller
                  </Badge>
                  <Badge className="bg-gradient-to-r from-pink-400 to-purple-500 text-white border-0 px-3 py-1">
                    <i className="fas fa-star mr-1"></i>
                    Dreamweaver
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Elegant Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-6">
          <Link href="/matchmaking">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                  <i className="fas fa-sparkles text-white text-xl"></i>
                </div>
                <h3
                  className="font-bold mb-2 text-lg text-purple-700 dark:text-purple-300"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {theme.terminology.quickMatch}
                </h3>
                <p
                  className="text-sm text-purple-600 dark:text-purple-400"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Find magical partners
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
                  <i className="fas fa-book-open text-white text-xl"></i>
                </div>
                <h3
                  className="font-bold mb-2 text-lg text-blue-700 dark:text-blue-300"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {theme.terminology.tableSync}
                </h3>
                <p
                  className="text-sm text-blue-600 dark:text-blue-400"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Synchronize stories
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-pink-200 dark:border-pink-800 shadow-lg hover:shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center shadow-md">
                <i className="fas fa-calendar-heart text-white text-xl"></i>
              </div>
              <h3
                className="font-bold mb-2 text-lg text-pink-700 dark:text-pink-300"
                style={{ fontFamily: theme.fonts.heading }}
              >
                {theme.terminology.events}
              </h3>
              <p
                className="text-sm text-pink-600 dark:text-pink-400"
                style={{ fontFamily: theme.fonts.body }}
              >
                Grand gatherings
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center shadow-md">
                <i className="fas fa-castle text-white text-xl"></i>
              </div>
              <h3
                className="font-bold mb-2 text-lg text-indigo-700 dark:text-indigo-300"
                style={{ fontFamily: theme.fonts.heading }}
              >
                Royal Court
              </h3>
              <p
                className="text-sm text-indigo-600 dark:text-indigo-400"
                style={{ fontFamily: theme.fonts.body }}
              >
                Connect with dreamers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Game Pod Calendar */}
        <div className="mb-8">
          <GamePodCalendar
            communityId="decksong"
            communityName="Decksong"
            theme={theme}
          />
        </div>

        {/* Enchanted Library Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Magic Mirror (Activity) */}
          <Card className="lg:col-span-2 bg-white/95 backdrop-blur-sm border-2 border-purple-300 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-cyan-400 text-white">
              <CardTitle
                className="flex items-center gap-4 text-2xl"
                style={{ fontFamily: theme.fonts.heading }}
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-mirror text-white text-xl"></i>
                </div>
                {theme.terminology.notifications}
              </CardTitle>
              <CardDescription
                className="text-white/90 text-lg"
                style={{ fontFamily: theme.fonts.body }}
              >
                Peer into the magical happenings across the Great Illuminary
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-2xl border border-purple-200">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-magic text-white text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-bold text-xl text-purple-800"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Welcome to the Great Illuminary,{" "}
                      {user.firstName || "Storyteller"}!
                    </p>
                    <p
                      className="text-purple-600 text-lg"
                      style={{ fontFamily: theme.fonts.accent }}
                    >
                      Your tale begins now. Let&apos;s create something truly magical
                      together
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 text-lg px-4 py-2">
                    <i className="fas fa-sparkles mr-2"></i>
                    NEW
                  </Badge>
                </div>

                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-feather text-white text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-bold text-xl text-cyan-800"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Enchanted Duel Challenge
                    </p>
                    <p
                      className="text-cyan-600 text-lg"
                      style={{ fontFamily: theme.fonts.accent }}
                    >
                      Royal Storyteller Emma invites you to weave a
                      collaborative tale
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 text-lg px-4 py-2">
                    3h ago
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storyteller's Grimoire */}
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-cyan-300 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white">
              <CardTitle
                className="flex items-center gap-3 text-xl"
                style={{ fontFamily: theme.fonts.heading }}
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-book-magic text-white"></i>
                </div>
                Storyteller's Grimoire
              </CardTitle>
              <CardDescription
                className="text-white/90"
                style={{ fontFamily: theme.fonts.body }}
              >
                Your magical journey through Disney's realms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-4 mb-4">
                    <i className="fas fa-crown text-3xl text-purple-600"></i>
                    <span
                      className="font-bold text-xl text-purple-800"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Current Realm: Decksong
                    </span>
                  </div>
                  <div className="space-y-4 text-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600">Storyteller Rank:</span>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-4 py-2">
                        Royal
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600">Favorite Ink:</span>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 border-2 border-amber-500 shadow-sm"></div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-purple-600 shadow-sm"></div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 border-2 border-cyan-500 shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600">Tales Woven:</span>
                      <span className="font-bold text-purple-800">127</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-600 hover:to-cyan-500 text-white border-0 text-xl py-4 shadow-lg"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  <i className="fas fa-sparkles mr-3"></i>
                  Begin Enchanted Duel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
