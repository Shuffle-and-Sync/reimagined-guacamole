import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UsersIcon, TrophyIcon, ClockIcon } from "lucide-react";

export default function CalendarLoginPrompt() {
  const handleLogin = () => {
    // Redirect to login - this will redirect back to calendar after authentication
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <CalendarIcon className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              TCG Event Calendar
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Discover tournaments, conventions, releases, and community events in your area
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <TrophyIcon className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <CardTitle className="text-xl">Tournament Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Find competitive events for Magic: The Gathering, Pokemon, Yu-Gi-Oh, and more trading card games
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <CardTitle className="text-xl">Community Events</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect with local gaming groups and participate in casual play sessions and game nights
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <CardTitle className="text-xl">Never Miss an Event</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get personalized notifications and add events to your calendar so you never miss important dates
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Login Call to Action */}
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                Ready to Get Started?
              </CardTitle>
              <CardDescription className="text-lg">
                Sign in to access the full calendar, create events, and connect with the TCG community
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="px-8 py-3 text-lg font-semibold"
                data-testid="button-login-calendar"
              >
                Sign In to View Calendar
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Join thousands of TCG players organizing events worldwide
              </p>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <div className="mt-16 text-left">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
              What You'll See After Signing In
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Regional Championship</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Magic: The Gathering • Tomorrow at 10:00 AM</p>
                  </div>
                  <TrophyIcon className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pokemon Draft Night</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Community Event • Friday at 7:00 PM</p>
                  </div>
                  <UsersIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">New Set Release</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Product Release • Next Monday</p>
                  </div>
                  <ClockIcon className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}