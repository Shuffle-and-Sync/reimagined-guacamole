import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const [location] = useLocation();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };
  
  const handleProfile = () => {
    window.location.href = "/profile";
  };

  const handleSettings = () => {
    console.log("Navigate to settings page");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Shuffle & Sync</span>
          </Link>
        </div>

        {/* Center: Main Navigation */}
        <nav className="flex items-center space-x-8">
          <Link 
            href="/" 
            className={`transition-colors font-medium ${location === "/" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
            data-testid="nav-home"
          >
            Home
          </Link>
          <Link 
            href="/tablesync" 
            className={`transition-colors font-medium ${location === "/tablesync" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
            data-testid="nav-tablesync"
          >
            TableSync
          </Link>
          <Link 
            href="/profile" 
            className={`transition-colors font-medium ${location === "/profile" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
            data-testid="nav-profile"
          >
            Profile
          </Link>
        </nav>

        {/* Right: User Menu */}
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ) : isAuthenticated && user ? (
            <>
              <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0" data-testid="button-user-menu">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-blue-600 text-white">
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleSignIn}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
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