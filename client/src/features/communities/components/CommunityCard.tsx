import React from "react";
import type { Community } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CommunityCardProps {
  community: Community;
  onSelect: () => void;
}

export function CommunityCard({ community, onSelect }: CommunityCardProps) {
  return (
    <Card
      className="community-card p-8 rounded-xl border-2 border-purple-300/30 hover:border-orange-400 group cursor-pointer transition-all duration-300 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-indigo-600/10 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-2"
      onClick={onSelect}
      data-testid={`card-community-${community.id}`}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center shadow-lg animate-float-gentle">
              <i className={`${community.iconClass} text-white text-xl`}></i>
            </div>
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-800 text-xs px-3 py-1 rounded-full font-bold animate-pulse">
              LIVE
            </Badge>
          </div>
          <div
            className="text-lg font-bold text-orange-300"
            data-testid={`text-status-${community.id}`}
          >
            Active
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-orange-300 transition-colors">
          {community.displayName}
        </h3>

        <p className="text-purple-200 mb-4 leading-relaxed">
          {community.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-users text-orange-400 text-sm"></i>
            <span
              className="text-sm text-purple-200"
              data-testid={`text-community-ready-${community.id}`}
            >
              Ready to explore
            </span>
          </div>
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
            <i className="fas fa-arrow-right text-white text-sm"></i>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
