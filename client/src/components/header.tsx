import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/contexts/CommunityContext";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Link, useLocation } from "wouter";

export function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { selectedCommunity, setSelectedCommunity, communities } = useCommunity();
  const [location] = useLocation();

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  
  const handleProfile = () => {
    setIsProfileDialogOpen(true);
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page when implemented
    console.log("Navigate to settings page");
  };

  const handleCommunityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const communityId = event.target.value;
    if (communityId === "") {
      setSelectedCommunity(null);
    } else {
      const community = communities.find(c => c.id === communityId);
      if (community) {
        setSelectedCommunity(community);
      }
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
            <span className="text-xl font-bold gradient-text">Shuffle & Sync</span>
          </Link>
          
          {/* Community Selector - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2 ml-8">
            <div className="flex items-center space-x-2">
              <i className="fas fa-users text-muted-foreground text-sm"></i>
              <select 
                className={`bg-muted border border-border rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary ${
                  selectedCommunity ? 'font-medium' : ''
                }`}
                data-testid="select-community"
                onChange={handleCommunityChange}
                value={selectedCommunity?.id || ""}
                style={{
                  color: selectedCommunity ? selectedCommunity.themeColor : undefined
                }}
              >
                <option value="">All Communities</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.displayName}
                  </option>
                ))}
              </select>
              {selectedCommunity && (
                <div 
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: selectedCommunity.themeColor }}
                  title={`${selectedCommunity.displayName} Community`}
                ></div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation - Hidden on smaller screens */}
        {isAuthenticated && (
          <nav className="hidden lg:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`transition-colors ${location === "/" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/tablesync" 
              className={`transition-colors ${location === "/tablesync" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              TableSync
            </Link>
            <Link 
              href="/social" 
              className={`transition-colors ${location === "/social" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Social Hub
            </Link>
            <Link 
              href="/calendar" 
              className={`transition-colors ${location === "/calendar" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Calendar
            </Link>
            <Link 
              href="/matchmaking" 
              className={`transition-colors ${location === "/matchmaking" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Matchmaking
            </Link>
          </nav>
        )}

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : isAuthenticated && user ? (
            <>
              <NotificationCenter />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0" data-testid="button-user-menu">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid="dropdown-user-menu">
                <DropdownMenuItem onClick={handleProfile} data-testid="menu-item-profile">
                  <i className="fas fa-user mr-2"></i>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettings} data-testid="menu-item-settings">
                  <i className="fas fa-cog mr-2"></i>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                onClick={handleSignIn}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleSignIn}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-md font-medium transition-colors"
                data-testid="button-join-free"
              >
                Join Free
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Profile Dialog */}
      <UserProfileDialog 
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />
    </header>
  );
}
