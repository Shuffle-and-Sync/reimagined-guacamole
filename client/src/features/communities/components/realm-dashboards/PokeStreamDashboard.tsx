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

interface PokeStreamDashboardProps {
  user: User;
}

export function PokeStreamDashboard({ user }: PokeStreamDashboardProps) {
  const theme = getCommunityTheme("pokestream-hub");

  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #ffd700 0%, #4a90e2 50%, #ffd700 100%)",
      }}
    >
      {/* Pokemon Center Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-yellow-500/20"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-4 border-yellow-400 shadow-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                <i className="fas fa-bolt text-white text-xl"></i>
              </div>
              <span
                className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent"
                style={{ fontFamily: theme.fonts.heading }}
              >
                PokeStream Hub
              </span>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-red-500 rounded-full flex items-center justify-center">
                <i className="fas fa-star text-white text-xl"></i>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback
                  className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1
                  className="text-5xl font-bold mb-2 text-white text-shadow-lg"
                  style={{
                    fontFamily: theme.fonts.heading,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  Hey {user.firstName || "Trainer"}!
                </h1>
                <p
                  className="text-xl text-white/90 mb-3"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Ready for your next Pokemon adventure?
                </p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-red-500 to-yellow-500 text-white border-0 text-lg px-4 py-2">
                    <i className="fas fa-medal mr-2"></i>
                    Elite Trainer
                  </Badge>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-lg px-4 py-2">
                    <i className="fas fa-star mr-2"></i>8 Badges
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Pokemon-themed Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-8">
          <Link href="/matchmaking">
            <Card className="group hover:scale-105 hover:rotate-1 transition-all duration-300 cursor-pointer bg-white border-4 border-red-400 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:animate-bounce">
                  <i className="fas fa-fist-raised text-white text-2xl"></i>
                </div>
                <h3
                  className="font-bold mb-2 text-xl text-red-600"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {theme.terminology.quickMatch}
                </h3>
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Battle wild trainers!
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card className="group hover:scale-105 hover:rotate-1 transition-all duration-300 cursor-pointer bg-white border-4 border-blue-400 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:animate-bounce">
                  <i className="fas fa-link text-white text-2xl"></i>
                </div>
                <h3
                  className="font-bold mb-2 text-xl text-blue-600"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {theme.terminology.tableSync}
                </h3>
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Trade across regions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="group hover:scale-105 hover:rotate-1 transition-all duration-300 cursor-pointer bg-white border-4 border-green-400 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:animate-bounce">
                <i className="fas fa-calendar-star text-white text-2xl"></i>
              </div>
              <h3
                className="font-bold mb-2 text-xl text-green-600"
                style={{ fontFamily: theme.fonts.heading }}
              >
                {theme.terminology.events}
              </h3>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: theme.fonts.body }}
              >
                Epic journeys await
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 hover:rotate-1 transition-all duration-300 cursor-pointer bg-white border-4 border-purple-400 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:animate-bounce">
                <i className="fas fa-users text-white text-2xl"></i>
              </div>
              <h3
                className="font-bold mb-2 text-xl text-purple-600"
                style={{ fontFamily: theme.fonts.heading }}
              >
                Pokemon Center
              </h3>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: theme.fonts.body }}
              >
                Meet other trainers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Game Pod Calendar */}
        <div className="mb-8">
          <GamePodCalendar
            communityId="pokestream-hub"
            communityName="PokeStream Hub"
            theme={theme}
          />
        </div>

        {/* Pokemon Lab Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PokeAlerts Feed */}
          <Card className="lg:col-span-2 bg-white border-4 border-yellow-400 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400">
              <CardTitle
                className="flex items-center gap-3 text-white text-2xl"
                style={{ fontFamily: theme.fonts.heading }}
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-bell text-white"></i>
                </div>
                {theme.terminology.notifications}
              </CardTitle>
              <CardDescription
                className="text-white/90"
                style={{ fontFamily: theme.fonts.body }}
              >
                Stay updated on Pokemon World happenings and trainer activities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <i className="fas fa-gift text-white text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-bold text-lg text-blue-800"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Welcome to Pokemon World, {user.firstName || "Trainer"}!
                    </p>
                    <p
                      className="text-blue-600"
                      style={{ fontFamily: theme.fonts.body }}
                    >
                      Your Pokedex has been activated and you're ready to catch
                      'em all!
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-red-500 to-yellow-500 text-white border-0">
                    NEW
                  </Badge>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-2xl border-2 border-green-200">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-yellow-500 flex items-center justify-center">
                    <i className="fas fa-trophy text-white text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-bold text-lg text-green-800"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Gym Challenge Available!
                    </p>
                    <p
                      className="text-green-600"
                      style={{ fontFamily: theme.fonts.body }}
                    >
                      Elite Trainer Alex is hosting a Champion-level tournament
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0">
                    2h ago
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trainer Profile */}
          <Card className="bg-white border-4 border-red-400 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-red-400 to-pink-400">
              <CardTitle
                className="flex items-center gap-3 text-white text-xl"
                style={{ fontFamily: theme.fonts.heading }}
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-id-card text-white"></i>
                </div>
                Trainer Card
              </CardTitle>
              <CardDescription
                className="text-white/90"
                style={{ fontFamily: theme.fonts.body }}
              >
                Your journey through the Pokemon World
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-red-50 to-yellow-50 rounded-xl border-2 border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                    <i className="fas fa-star text-2xl text-yellow-500"></i>
                    <span
                      className="font-bold text-lg text-red-600"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Current Region: Kanto
                    </span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Trainer Level:</span>
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                        Elite
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Badges Earned:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((badge) => (
                          <div
                            key={badge}
                            className={`w-6 h-6 rounded-full ${badge <= 6 ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gray-300"} flex items-center justify-center`}
                          >
                            <i
                              className={`fas fa-medal text-white text-xs ${badge > 6 ? "text-gray-500" : ""}`}
                            ></i>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Favorite Type:</span>
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                        <i className="fas fa-fire mr-1"></i>Fire
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 text-lg py-3"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  <i className="fas fa-pokeball mr-2"></i>
                  Start Wild Encounter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
