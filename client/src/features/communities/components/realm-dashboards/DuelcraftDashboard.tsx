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

interface DuelcraftDashboardProps {
  user: User;
}

export function DuelcraftDashboard({ user }: DuelcraftDashboardProps) {
  const theme = getCommunityTheme("duelcraft");

  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Ancient Egyptian/Yu-Gi-Oh Theme Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border-4 border-yellow-400 transform rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border-4 border-purple-400 transform rotate-12"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-blue-400 transform -rotate-12"></div>
      </div>

      <div className="relative z-10">
        {/* Shadow Realm Header */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-6 px-12 py-8 rounded-2xl bg-black/70 backdrop-blur-xl border-2 border-yellow-400 shadow-2xl relative">
              {/* Millennium Eye */}
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-eye text-yellow-400 text-2xl animate-pulse"></i>
                </div>
                <div
                  className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-spin"
                  style={{ animationDuration: "8s" }}
                ></div>
              </div>

              <span
                className="text-5xl font-bold text-yellow-400 tracking-wider"
                style={{
                  fontFamily: theme.fonts.heading,
                  textShadow:
                    "0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)",
                }}
              >
                DUELCRAFT
              </span>

              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl relative">
                <i className="fas fa-ankh text-yellow-400 text-2xl"></i>
                <div className="absolute inset-0 border-4 border-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8">
              <Avatar className="h-32 w-32 border-4 border-yellow-400 shadow-2xl">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-yellow-400"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1
                  className="text-6xl font-bold mb-4 text-yellow-400"
                  style={{
                    fontFamily: theme.fonts.heading,
                    textShadow:
                      "0 0 20px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)",
                  }}
                >
                  WELCOME, {(user.firstName || "DUELIST").toUpperCase()}
                </h1>
                <p
                  className="text-2xl text-purple-200 mb-4"
                  style={{
                    fontFamily: theme.fonts.body,
                    textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                  }}
                >
                  The heart of the cards calls to you...
                </p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 text-xl px-6 py-3 font-bold">
                    <i className="fas fa-skull mr-2"></i>
                    SHADOW DUELIST
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-yellow-400 border-2 border-yellow-400 text-xl px-6 py-3 font-bold">
                    <i className="fas fa-eye mr-2"></i>
                    MILLENNIUM POWER
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          {/* Duel Arena Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 -mt-8">
            <Link href="/matchmaking">
              <Card className="group hover:scale-110 transition-all duration-300 cursor-pointer bg-black/80 backdrop-blur-sm border-2 border-red-500 shadow-2xl hover:shadow-red-500/50">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center shadow-xl relative overflow-hidden">
                    <i className="fas fa-fire text-white text-3xl relative z-10"></i>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/50 to-orange-500/50 animate-pulse"></div>
                  </div>
                  <h3
                    className="font-bold mb-3 text-2xl text-red-400"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    {theme.terminology.quickMatch}
                  </h3>
                  <p
                    className="text-red-300"
                    style={{ fontFamily: theme.fonts.body }}
                  >
                    Challenge worthy opponents
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tablesync">
              <Card className="group hover:scale-110 transition-all duration-300 cursor-pointer bg-black/80 backdrop-blur-sm border-2 border-blue-500 shadow-2xl hover:shadow-blue-500/50">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-xl relative overflow-hidden">
                    <i className="fas fa-link text-white text-3xl relative z-10"></i>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 animate-pulse"></div>
                  </div>
                  <h3
                    className="font-bold mb-3 text-2xl text-blue-400"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    {theme.terminology.tableSync}
                  </h3>
                  <p
                    className="text-blue-300"
                    style={{ fontFamily: theme.fonts.body }}
                  >
                    Connect across dimensions
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="group hover:scale-110 transition-all duration-300 cursor-pointer bg-black/80 backdrop-blur-sm border-2 border-purple-500 shadow-2xl hover:shadow-purple-500/50">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl relative overflow-hidden">
                  <i className="fas fa-calendar-days text-white text-3xl relative z-10"></i>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-pink-500/50 animate-pulse"></div>
                </div>
                <h3
                  className="font-bold mb-3 text-2xl text-purple-400"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {theme.terminology.events}
                </h3>
                <p
                  className="text-purple-300"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Orchestrate shadow duels
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-110 transition-all duration-300 cursor-pointer bg-black/80 backdrop-blur-sm border-2 border-yellow-500 shadow-2xl hover:shadow-yellow-500/50">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-xl relative overflow-hidden">
                  <i className="fas fa-users text-black text-3xl relative z-10"></i>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/50 to-orange-400/50 animate-pulse"></div>
                </div>
                <h3
                  className="font-bold mb-3 text-2xl text-yellow-400"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  Shadow Realm
                </h3>
                <p
                  className="text-yellow-300"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Unite with fellow duelists
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Game Pod Calendar */}
          <div className="mb-8">
            <GamePodCalendar
              communityId="duelcraft"
              communityName="Duelcraft"
              theme={theme}
            />
          </div>

          {/* Ancient Tablet Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Millennium Alerts */}
            <Card className="lg:col-span-2 bg-black/90 backdrop-blur-sm border-2 border-yellow-400 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                <CardTitle
                  className="flex items-center gap-4 text-2xl font-bold"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  <div className="w-14 h-14 bg-black/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-bell text-black text-xl"></i>
                  </div>
                  {theme.terminology.notifications}
                </CardTitle>
                <CardDescription
                  className="text-black/80 text-lg font-semibold"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Messages from the Shadow Realm reach across dimensions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl border border-yellow-400/30">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <i className="fas fa-eye text-black text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-bold text-xl text-yellow-400 mb-2"
                        style={{ fontFamily: theme.fonts.heading }}
                      >
                        WELCOME TO THE SHADOW REALM,{" "}
                        {(user.firstName || "DUELIST").toUpperCase()}!
                      </p>
                      <p
                        className="text-purple-200 text-lg"
                        style={{ fontFamily: theme.fonts.body }}
                      >
                        Your millennium item has awakened. The ancient power
                        flows through you.
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-lg px-4 py-2 font-bold">
                      <i className="fas fa-skull mr-2"></i>
                      ACTIVE
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl border border-blue-400/30">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <i className="fas fa-cards text-white text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-bold text-xl text-blue-400 mb-2"
                        style={{ fontFamily: theme.fonts.heading }}
                      >
                        SHADOW DUEL CHALLENGE
                      </p>
                      <p
                        className="text-blue-200 text-lg"
                        style={{ fontFamily: theme.fonts.body }}
                      >
                        Duel Master Kaiba seeks a worthy opponent for an epic
                        shadow duel
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-lg px-4 py-2 font-bold">
                      4h ago
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duelist Profile */}
            <Card className="bg-black/90 backdrop-blur-sm border-2 border-purple-400 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle
                  className="flex items-center gap-3 text-xl font-bold"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-id-card text-white"></i>
                  </div>
                  DUELIST PROFILE
                </CardTitle>
                <CardDescription
                  className="text-white/90 font-semibold"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Your journey through the Duel Monsters realm
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-xl border border-yellow-400/30">
                    <div className="flex items-center gap-4 mb-4">
                      <i className="fas fa-eye text-3xl text-yellow-400"></i>
                      <span
                        className="font-bold text-xl text-yellow-400"
                        style={{ fontFamily: theme.fonts.heading }}
                      >
                        ACTIVE REALM: DUELCRAFT
                      </span>
                    </div>
                    <div className="space-y-4 text-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200 font-semibold">
                          Duel Rank:
                        </span>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg px-4 py-2">
                          MASTER
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200 font-semibold">
                          Millennium Item:
                        </span>
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-yellow-500 flex items-center justify-center">
                            <i className="fas fa-eye text-black text-sm"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200 font-semibold">
                          Shadow Duels Won:
                        </span>
                        <span className="font-bold text-yellow-400 text-xl">
                          89
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white border-0 text-xl py-4 font-bold shadow-lg"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    <i className="fas fa-fire mr-3"></i>
                    INITIATE SHADOW DUEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
