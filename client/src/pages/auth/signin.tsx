import { useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { useAuth } from "@/features/auth";

export default function SignIn() {
  useDocumentTitle("Sign In - Shuffle & Sync");
  
  const { signIn, isAuthenticated } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleGoogleSignIn = () => {
    signIn('google');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your Shuffle & Sync account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center gap-2"
            variant="outline"
            data-testid="button-signin-google"
          >
            <FaGoogle className="w-4 h-4" />
            Continue with Google
          </Button>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Join the TCG streaming community and coordinate your next collaborative stream!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}