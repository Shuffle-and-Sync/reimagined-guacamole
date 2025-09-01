import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { Header } from "@/components/header";
import { useCommunity } from "@/contexts/CommunityContext";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisWeek: number;
    retentionRate: number;
  };
  gameStats: {
    totalSessions: number;
    averageSessionDuration: number;
    popularGames: Array<{ name: string; sessions: number; color: string }>;
    weeklyActivity: Array<{ date: string; sessions: number; users: number }>;
  };
  communityStats: {
    totalCommunities: number;
    activeCommunities: number;
    membershipDistribution: Array<{ community: string; members: number; color: string }>;
  };
  tournamentStats: {
    totalTournaments: number;
    activeTournaments: number;
    totalParticipants: number;
    avgParticipantsPerTournament: number;
  };
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  useDocumentTitle("Analytics Dashboard");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity } = useCommunity();
  
  const [timeRange, setTimeRange] = useState('7d');
  
  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', timeRange, selectedCommunity?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ timeRange });
      if (selectedCommunity?.id) {
        params.append('community', selectedCommunity.id);
      }
      const response = await fetch(`/api/analytics?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Mock data for demonstration
  const mockAnalytics: AnalyticsData = {
    userStats: {
      totalUsers: 1247,
      activeUsers: 892,
      newUsersThisWeek: 34,
      retentionRate: 76.3
    },
    gameStats: {
      totalSessions: 3456,
      averageSessionDuration: 127,
      popularGames: [
        { name: 'Magic: The Gathering', sessions: 1234, color: '#FF6B35' },
        { name: 'Pokemon TCG', sessions: 987, color: '#4ECDC4' },
        { name: 'Yu-Gi-Oh!', sessions: 654, color: '#45B7D1' },
        { name: 'Lorcana', sessions: 432, color: '#96CEB4' },
        { name: 'One Piece', sessions: 234, color: '#FFEAA7' },
        { name: 'Flesh and Blood', sessions: 156, color: '#DDA0DD' }
      ],
      weeklyActivity: [
        { date: '2025-01-26', sessions: 45, users: 32 },
        { date: '2025-01-27', sessions: 52, users: 38 },
        { date: '2025-01-28', sessions: 67, users: 45 },
        { date: '2025-01-29', sessions: 78, users: 52 },
        { date: '2025-01-30', sessions: 89, users: 61 },
        { date: '2025-01-31', sessions: 95, users: 67 },
        { date: '2025-02-01', sessions: 103, users: 74 }
      ]
    },
    communityStats: {
      totalCommunities: 6,
      activeCommunities: 6,
      membershipDistribution: [
        { community: 'Magic: The Gathering', members: 467, color: '#FF6B35' },
        { community: 'Pokemon TCG', members: 356, color: '#4ECDC4' },
        { community: 'Yu-Gi-Oh!', members: 234, color: '#45B7D1' },
        { community: 'Lorcana', members: 189, color: '#96CEB4' },
        { community: 'One Piece', members: 123, color: '#FFEAA7' },
        { community: 'Flesh and Blood', members: 89, color: '#DDA0DD' }
      ]
    },
    tournamentStats: {
      totalTournaments: 67,
      activeTournaments: 12,
      totalParticipants: 456,
      avgParticipantsPerTournament: 8.2
    }
  };

  const displayData = analytics || mockAnalytics;

  const exportData = () => {
    const dataStr = JSON.stringify(displayData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shuffle-sync-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Analytics exported",
      description: "Analytics data has been downloaded as JSON"
    });
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-4">
                Analytics Dashboard
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Insights into platform usage, community engagement, and tournament participation across all TCG realms.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportData} data-testid="button-export-analytics">
                <i className="fas fa-download mr-2"></i>
                Export Data
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="games" data-testid="tab-games">Games</TabsTrigger>
            <TabsTrigger value="tournaments" data-testid="tab-tournaments">Tournaments</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <i className="fas fa-users text-blue-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-total-users">
                    {formatNumber(displayData.userStats.totalUsers)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{displayData.userStats.newUsersThisWeek} this week
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <i className="fas fa-user-check text-green-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-active-users">
                    {formatNumber(displayData.userStats.activeUsers)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((displayData.userStats.activeUsers / displayData.userStats.totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Game Sessions</CardTitle>
                  <i className="fas fa-gamepad text-purple-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-game-sessions">
                    {formatNumber(displayData.gameStats.totalSessions)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg {formatDuration(displayData.gameStats.averageSessionDuration)} per session
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                  <i className="fas fa-trophy text-orange-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-tournaments">
                    {displayData.tournamentStats.totalTournaments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {displayData.tournamentStats.activeTournaments} currently active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity Trend</CardTitle>
                  <CardDescription>Sessions and active users over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={displayData.gameStats.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value, name) => [value, name === 'sessions' ? 'Sessions' : 'Active Users']}
                      />
                      <Area type="monotone" dataKey="sessions" stackId="1" stroke="#3B82F6" fill="#3B82F6" opacity={0.6} />
                      <Area type="monotone" dataKey="users" stackId="2" stroke="#10B981" fill="#10B981" opacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Games</CardTitle>
                  <CardDescription>Sessions by game type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={displayData.gameStats.popularGames}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="sessions"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {displayData.gameStats.popularGames.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Sessions']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-users text-blue-500"></i>
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Registered</span>
                      <span className="font-bold" data-testid="stat-total-registered">
                        {formatNumber(displayData.userStats.totalUsers)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Currently Active</span>
                      <span className="font-bold text-green-600" data-testid="stat-currently-active">
                        {formatNumber(displayData.userStats.activeUsers)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New This Week</span>
                      <span className="font-bold text-blue-600" data-testid="stat-new-this-week">
                        +{displayData.userStats.newUsersThisWeek}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Retention Rate</span>
                      <span className="font-bold" data-testid="stat-retention-rate">
                        {displayData.userStats.retentionRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-chart-line text-green-500"></i>
                    Engagement Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Session Duration</span>
                      <span className="font-bold">
                        {formatDuration(displayData.gameStats.averageSessionDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sessions per User</span>
                      <span className="font-bold">
                        {(displayData.gameStats.totalSessions / displayData.userStats.totalUsers).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Communities</span>
                      <span className="font-bold">
                        {displayData.communityStats.activeCommunities}/{displayData.communityStats.totalCommunities}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-crown text-orange-500"></i>
                    Top Communities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayData.communityStats.membershipDistribution
                      .sort((a, b) => b.members - a.members)
                      .slice(0, 5)
                      .map((community, index) => (
                        <div key={community.community} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: community.color }}
                            ></div>
                            <span className="text-sm font-medium">
                              {index + 1}. {community.community}
                            </span>
                          </div>
                          <Badge variant="outline" data-testid={`community-members-${index}`}>
                            {formatNumber(community.members)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Games */}
          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Game Popularity</CardTitle>
                  <CardDescription>Sessions by game format</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={displayData.gameStats.popularGames}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Sessions']} />
                      <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                        {displayData.gameStats.popularGames.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Game sessions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={displayData.gameStats.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value, name) => [value, name === 'sessions' ? 'Sessions' : 'Users']}
                      />
                      <Line type="monotone" dataKey="sessions" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} />
                      <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Game Format Breakdown</CardTitle>
                <CardDescription>Detailed statistics by game format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayData.gameStats.popularGames.map((game, index) => (
                    <div key={game.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{game.name}</h4>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: game.color }}
                        ></div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Sessions:</span>
                          <span className="font-medium">{formatNumber(game.sessions)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Market Share:</span>
                          <span className="font-medium">
                            {((game.sessions / displayData.gameStats.totalSessions) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments */}
          <TabsContent value="tournaments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
                  <i className="fas fa-trophy text-yellow-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-total-tournaments">
                    {displayData.tournamentStats.totalTournaments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {displayData.tournamentStats.activeTournaments} currently active
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <i className="fas fa-users-cog text-purple-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-tournament-participants">
                    {displayData.tournamentStats.totalParticipants}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all tournaments
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Participants</CardTitle>
                  <i className="fas fa-calculator text-blue-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-avg-participants">
                    {displayData.tournamentStats.avgParticipantsPerTournament}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per tournament
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                  <i className="fas fa-percentage text-green-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-participation-rate">
                    {((displayData.tournamentStats.totalParticipants / displayData.userStats.totalUsers) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Of total users
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Insights</CardTitle>
                <CardDescription>Performance and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.round((displayData.tournamentStats.activeTournaments / displayData.tournamentStats.totalTournaments) * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Active Tournament Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatDuration(displayData.gameStats.averageSessionDuration)}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Tournament Duration</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {Math.round(displayData.tournamentStats.avgParticipantsPerTournament)}
                    </div>
                    <p className="text-sm text-muted-foreground">Players per Tournament</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}