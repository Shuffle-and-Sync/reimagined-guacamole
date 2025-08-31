import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Community } from "@shared/schema";

interface CommunityCardProps {
  community: Community;
  onSelect: () => void;
}

export function CommunityCard({ community, onSelect }: CommunityCardProps) {
  // Mock active users for demo
  const activeUsers = Math.floor(Math.random() * 1000) + 200;
  const onlineNow = Math.floor(activeUsers * 0.7);

  return (
    <Card 
      className="community-card p-8 rounded-xl border border-border hover:border-primary group cursor-pointer transition-all duration-300"
      onClick={onSelect}
      data-testid={`card-community-${community.id}`}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <i className={`${community.iconClass} text-white text-xl`}></i>
            </div>
            <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              LIVE
            </Badge>
          </div>
          <div className="text-2xl font-bold text-accent" data-testid={`text-active-users-${community.id}`}>
            {activeUsers}
          </div>
        </div>
        
        <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
          {community.displayName}
        </h3>
        
        <p className="text-muted-foreground mb-4">
          {community.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-users text-primary text-sm"></i>
            <span className="text-sm text-muted-foreground" data-testid={`text-online-now-${community.id}`}>
              {onlineNow} online
            </span>
          </div>
          <i className="fas fa-arrow-right text-primary opacity-0 group-hover:opacity-100 transition-opacity"></i>
        </div>
      </CardContent>
    </Card>
  );
}
