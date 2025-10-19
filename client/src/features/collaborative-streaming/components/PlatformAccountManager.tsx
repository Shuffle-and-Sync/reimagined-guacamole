import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Users,
  Settings,
  RefreshCw,
  Youtube,
  Twitch,
  Facebook,
  Shield,
  Clock,
  Eye,
} from "lucide-react";
import { SiTwitch, SiYoutube, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeUserPlatformAccount } from "@shared/schema";

type PlatformAccount = SafeUserPlatformAccount;

interface PlatformStatus {
  isConnected: boolean;
  isExpired: boolean;
  expiryDate?: string;
  lastChecked?: string;
}

const PLATFORM_INFO = {
  twitch: {
    name: "Twitch",
    icon: SiTwitch,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    description:
      "Connect your Twitch account to stream and coordinate with other creators",
    capabilities: [
      "Live streaming",
      "Chat integration",
      "Viewer analytics",
      "Stream coordination",
    ],
  },
  youtube: {
    name: "YouTube",
    icon: SiYoutube,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    description:
      "Connect your YouTube channel for live broadcasts and collaboration",
    capabilities: [
      "Live broadcasts",
      "Scheduled streams",
      "Community posts",
      "Analytics",
    ],
  },
  facebook: {
    name: "Facebook Gaming",
    icon: SiFacebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    description: "Connect your Facebook Gaming account for live streaming",
    capabilities: [
      "Live video",
      "Community engagement",
      "Audience insights",
      "Cross-promotion",
    ],
  },
};

export function PlatformAccountManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null,
  );

  // Fetch platform accounts
  const {
    data: accounts = [],
    isLoading,
    refetch,
  } = useQuery<PlatformAccount[]>({
    queryKey: ["/api/platforms/accounts"],
    enabled: !!user,
  });

  // Fetch platform status
  const { data: platformStatuses = {} } = useQuery<
    Record<string, PlatformStatus>
  >({
    queryKey: ["/api/platforms/status"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Connect platform account mutation
  const connectPlatform = useMutation({
    mutationFn: async (platform: string) => {
      const response = await fetch(
        "/api/platforms/" + platform + "/oauth/initiate",
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to initiate OAuth");
      }
      return response.json();
    },
    onSuccess: (data, platform) => {
      // Redirect to OAuth flow
      if (data && typeof data === "object" && "authUrl" in data) {
        window.location.href = (data as any).authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate platform connection",
        variant: "destructive",
      });
      setConnectingPlatform(null);
    },
  });

  // Disconnect platform account mutation
  const disconnectPlatform = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("DELETE", "/api/platforms/accounts/" + accountId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms/status"] });
      toast({
        title: "Account Disconnected",
        description: "Platform account has been successfully disconnected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect platform account",
        variant: "destructive",
      });
    },
  });

  // Refresh token mutation
  const refreshToken = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest(
        "POST",
        "/api/platforms/" + platform + "/refresh",
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms/status"] });
      toast({
        title: "Token Refreshed",
        description: "Platform access token has been successfully refreshed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh platform token",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (platform: string) => {
    setConnectingPlatform(platform);
    connectPlatform.mutate(platform);
  };

  const handleDisconnect = (accountId: string, platform: string) => {
    if (
      confirm(
        `Are you sure you want to disconnect your ${PLATFORM_INFO[platform as keyof typeof PLATFORM_INFO]?.name} account?`,
      )
    ) {
      disconnectPlatform.mutate(accountId);
    }
  };

  const handleRefreshToken = (platform: string) => {
    refreshToken.mutate(platform);
  };

  const getAccountByPlatform = (
    platform: string,
  ): PlatformAccount | undefined => {
    return Array.isArray(accounts)
      ? accounts.find(
          (account: PlatformAccount) => account.platform === platform,
        )
      : undefined;
  };

  const getPlatformStatus = (platform: string): PlatformStatus => {
    return (
      (platformStatuses as Record<string, PlatformStatus>)[platform] || {
        isConnected: false,
        isExpired: false,
      }
    );
  };

  const getConnectionStatus = (platform: string) => {
    const account = getAccountByPlatform(platform);
    const status = getPlatformStatus(platform);

    if (!account) return "disconnected";
    if (status.isExpired) return "expired";
    if (status.isConnected) return "connected";
    return "unknown";
  };

  const renderPlatformCard = (platform: string) => {
    const info = PLATFORM_INFO[platform as keyof typeof PLATFORM_INFO];
    const account = getAccountByPlatform(platform);
    const status = getPlatformStatus(platform);
    const connectionStatus = getConnectionStatus(platform);
    const IconComponent = info.icon;

    return (
      <Card
        key={platform}
        className={`transition-all hover:shadow-md ${info.bgColor}`}
        data-testid={`platform-card-${platform}`}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                <IconComponent className={`h-6 w-6 ${info.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{info.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {info.description}
                </p>
              </div>
            </div>

            {connectionStatus === "connected" && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
            {connectionStatus === "expired" && (
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
            {connectionStatus === "disconnected" && (
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-800 border-gray-200"
              >
                Not Connected
              </Badge>
            )}
          </div>

          {account && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">@{account.handle}</span>
                {account.channelId && (
                  <span className="text-muted-foreground">
                    • Channel ID: {account.channelId}
                  </span>
                )}
              </div>

              {account.tokenExpiresAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Token expires:{" "}
                    {new Date(account.tokenExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {Array.isArray(account.scopes) &&
                  account.scopes.map((scope: string) => (
                    <Badge key={scope} variant="secondary" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Capabilities</h4>
            <ul className="space-y-1">
              {info.capabilities.map((capability) => (
                <li
                  key={capability}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {capability}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            {connectionStatus === "disconnected" ? (
              <Button
                onClick={() => handleConnect(platform)}
                disabled={
                  connectingPlatform === platform || connectPlatform.isPending
                }
                className="flex-1"
                data-testid={`button-connect-${platform}`}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {connectingPlatform === platform
                  ? "Connecting..."
                  : `Connect ${info.name}`}
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                {connectionStatus === "expired" && (
                  <Button
                    onClick={() => handleRefreshToken(platform)}
                    disabled={refreshToken.isPending}
                    variant="outline"
                    className="flex-1"
                    data-testid={`button-refresh-${platform}`}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {refreshToken.isPending ? "Refreshing..." : "Refresh Token"}
                  </Button>
                )}

                <Button
                  onClick={() =>
                    account && handleDisconnect(account.id, platform)
                  }
                  disabled={disconnectPlatform.isPending}
                  variant="outline"
                  data-testid={`button-disconnect-${platform}`}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="platform-manager-loading">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="w-64 h-6 bg-gray-300 rounded" />
              <div className="w-full h-4 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-full h-48 bg-gray-300 rounded-lg" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const connectedAccounts = Array.isArray(accounts)
    ? accounts.filter((account: PlatformAccount) => account.isActive)
    : [];
  const expiredAccounts = Array.isArray(accounts)
    ? accounts.filter((account: PlatformAccount) => {
        const status = getPlatformStatus(account.platform);
        return status.isExpired;
      })
    : [];

  return (
    <div className="space-y-6" data-testid="platform-account-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Accounts</h2>
          <p className="text-muted-foreground">
            Connect your streaming platforms to enable cross-platform
            coordination
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          disabled={isLoading}
          data-testid="button-refresh-accounts"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-connected-platforms">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connected Platforms
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for streaming coordination
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-expired-tokens">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expired Tokens
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {expiredAccounts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require token refresh
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-viewers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Reach
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">∞</div>
            <p className="text-xs text-muted-foreground">
              Cross-platform audience
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {expiredAccounts.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {expiredAccounts.length} platform account
            {expiredAccounts.length > 1 ? "s have" : " has"} expired tokens.
            Refresh them to enable streaming coordination.
          </AlertDescription>
        </Alert>
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.keys(PLATFORM_INFO).map(renderPlatformCard)}
      </div>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Secure OAuth Flow</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Industry-standard OAuth 2.0 authentication</li>
                <li>
                  • PKCE (Proof Key for Code Exchange) for enhanced security
                </li>
                <li>• Tokens stored securely with encryption</li>
                <li>• Automatic token refresh when possible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Privacy</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Only requested permissions are accessed</li>
                <li>• No storage of streaming content</li>
                <li>• Minimal data collection for coordination</li>
                <li>• Disconnect anytime without data retention</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <span>
              Connected platforms maintain their own privacy policies and terms
              of service. Review each platform's documentation for details.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
