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

interface ScryGatherDashboardProps {
  user: User;
}

export function ScryGatherDashboard({ user }: ScryGatherDashboardProps) {
  const theme = getCommunityTheme("scry-gather");

  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen" style={{ background: theme.gradients.hero }}>
      {/* Planeswalker Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center space-y-6">
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
              style={{
                backgroundColor: theme.colors.primary + "20",
                border: `2px solid ${theme.colors.primary}`,
              }}
            >
              <i
                className="fas fa-magic text-2xl"
                style={{ color: theme.colors.primary }}
              ></i>
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.primary,
                }}
              >
                Scry & Gather
              </span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Avatar
                className="h-20 w-20 border-4"
                style={{ borderColor: theme.colors.primary }}
              >
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback
                  className="text-2xl font-bold"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.text,
                    fontFamily: theme.fonts.heading,
                  }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1
                  className="text-4xl font-bold mb-2"
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.text,
                  }}
                >
                  Welcome, {user.firstName || "Planeswalker"}
                </h1>
                <p
                  className="text-lg"
                  style={{
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                  }}
                >
                  Ready to explore the Multiverse?
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0">
                    <i className="fas fa-fire mr-2"></i>
                    Active Planeswalker
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Mana-themed Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-6">
          <Link href="/matchmaking">
            <Card
              className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2"
              style={{
                borderColor: theme.colors.primary,
                background: theme.gradients.card,
              }}
            >
              <CardContent className="p-6 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center relative"
                  style={{
                    background:
                      "linear-gradient(135deg, #ff4444 0%, #ff8844 100%)",
                  }}
                >
                  <i className="fas fa-fire text-white text-xl"></i>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">R</span>
                  </div>
                </div>
                <h3
                  className="font-bold mb-2"
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.text,
                  }}
                >
                  {theme.terminology.quickMatch}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Cast instant connections
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card
              className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2"
              style={{
                borderColor: theme.colors.accent,
                background: theme.gradients.card,
              }}
            >
              <CardContent className="p-6 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center relative"
                  style={{
                    background:
                      "linear-gradient(135deg, #4444ff 0%, #8844ff 100%)",
                  }}
                >
                  <i className="fas fa-portal-enter text-white text-xl"></i>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">U</span>
                  </div>
                </div>
                <h3
                  className="font-bold mb-2"
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.text,
                  }}
                >
                  {theme.terminology.tableSync}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Synchronize planes
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card
            className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2"
            style={{ borderColor: "#44ff44", background: theme.gradients.card }}
          >
            <CardContent className="p-6 text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center relative"
                style={{
                  background:
                    "linear-gradient(135deg, #44ff44 0%, #88ff44 100%)",
                }}
              >
                <i className="fas fa-leaf text-white text-xl"></i>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
              </div>
              <h3
                className="font-bold mb-2"
                style={{
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                }}
              >
                {theme.terminology.events}
              </h3>
              <p
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Cultivate community
              </p>
            </CardContent>
          </Card>

          <Card
            className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2"
            style={{ borderColor: "#ffff44", background: theme.gradients.card }}
          >
            <CardContent className="p-6 text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center relative"
                style={{
                  background:
                    "linear-gradient(135deg, #ffff44 0%, #ffaa44 100%)",
                }}
              >
                <i className="fas fa-crown text-white text-xl"></i>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
              </div>
              <h3
                className="font-bold mb-2"
                style={{
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                }}
              >
                Guild Hall
              </h3>
              <p
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Social sanctum
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Game Pod Calendar - TODO: Integrate with events feature */}
        <div className="mb-8">
          <Card
            className="border-2"
            style={{
              borderColor: "#ffff44",
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            }}
          >
            <CardContent className="p-6 text-center">
              <p className="text-yellow-300">Game Pod Calendar - Coming Soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Ancient Tome Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mystical Visions (Activity) */}
          <Card
            className="lg:col-span-2 border-2"
            style={{
              borderColor: theme.colors.primary,
              background: theme.gradients.card,
            }}
          >
            <CardHeader>
              <CardTitle
                className="flex items-center gap-3"
                style={{
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: theme.gradients.primary }}
                >
                  <i className="fas fa-crystal-ball text-white"></i>
                </div>
                {theme.terminology.notifications}
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Peer into the flow of mystic energies across the planes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="flex items-center gap-4 p-4 rounded-lg"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600">
                    <i className="fas fa-scroll text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      Welcome to the Multiverse,{" "}
                      {user.firstName || "Planeswalker"}!
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Your spark has ignited and you&apos;ve joined the ranks of
                      planeswalkers
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: theme.colors.primary,
                      color: theme.colors.primary,
                    }}
                  >
                    Just now
                  </Badge>
                </div>

                <div
                  className="flex items-center gap-4 p-4 rounded-lg"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-red-600 to-orange-600">
                    <i className="fas fa-magic text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      Spell Circle Discovery
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      A new planeswalker seeks allies for Commander adventures
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: theme.colors.accent,
                      color: theme.colors.accent,
                    }}
                  >
                    2h ago
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planeswalker Codex (Communities) */}
          <Card
            className="border-2"
            style={{
              borderColor: theme.colors.accent,
              background: theme.gradients.card,
            }}
          >
            <CardHeader>
              <CardTitle
                className="flex items-center gap-3"
                style={{
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.primary})`,
                  }}
                >
                  <i className="fas fa-book-spells text-white"></i>
                </div>
                Planar Codex
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Your planeswalker knowledge and guild affiliations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <i
                      className="fas fa-magic text-lg"
                      style={{ color: theme.colors.primary }}
                    ></i>
                    <span
                      className="font-semibold"
                      style={{ color: theme.colors.text }}
                    >
                      Current Plane: Scry & Gather
                    </span>
                  </div>
                  <div
                    className="space-y-2 text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    <div className="flex justify-between">
                      <span>Planeswalker Rank:</span>
                      <Badge
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: theme.colors.text,
                        }}
                      >
                        Initiate
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Mana Affinity:</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full bg-red-500 border border-red-600"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-500 border border-blue-600"></div>
                        <div className="w-4 h-4 rounded-full bg-black border border-gray-600"></div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Favorite Format:</span>
                      <span className="font-medium">Commander</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  style={{
                    background: theme.gradients.primary,
                    borderColor: theme.colors.primary,
                  }}
                >
                  <i className="fas fa-portal-enter mr-2"></i>
                  Enter Spell Circle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
