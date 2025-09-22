import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaGoogle } from "react-icons/fa";
import { Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function SignIn() {
  useDocumentTitle("Sign In - Shuffle & Sync");
  
  const { signIn, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCredentialsLogin, setIsCredentialsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form setup
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleGoogleSignIn = () => {
    signIn('google');
  };

  const handleCredentialsLogin = async (values: LoginForm) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Use Auth.js v5 credentials signin
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('redirect', 'false');
      formData.append('callbackUrl', '/home');
      
      const response = await fetch('/api/auth/signin/credentials', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.url) {
          // Success - redirect to provided URL
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          });
          window.location.href = data.url;
        } else {
          // Session created successfully
          window.location.href = '/home';
        }
      } else {
        const errorText = await response.text();
        
        // Handle specific error cases
        if (errorText.includes('MFA_REQUIRED')) {
          // Store email for MFA verification and redirect
          sessionStorage.setItem('mfa_email', values.email);
          toast({
            title: "MFA Required",
            description: "Please complete multi-factor authentication.",
            variant: "default",
          });
          // Redirect to MFA verification page
          window.location.href = '/auth/mfa-verify';
        } else if (errorText.includes('CredentialsSignin')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (errorText.includes('too many failed attempts')) {
          setError('Account temporarily locked due to too many failed attempts.');
        } else if (errorText.includes('email verification')) {
          setError('Please verify your email address before signing in.');
        } else {
          setError('Sign in failed. Please check your credentials and try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your Shuffle & Sync account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Sign In */}
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center gap-2"
            variant="outline"
            data-testid="button-signin-google"
          >
            <FaGoogle className="w-4 h-4" />
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          {/* Email/Password Sign In */}
          {!isCredentialsLogin ? (
            <Button 
              onClick={() => setIsCredentialsLogin(true)}
              className="w-full flex items-center gap-2"
              variant="secondary"
              data-testid="button-signin-credentials"
            >
              <Mail className="w-4 h-4" />
              Sign in with Email
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCredentialsLogin)} className="space-y-4">
                {error && (
                  <Alert variant="destructive" data-testid="alert-login-error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email"
                          data-testid="input-email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password"
                          data-testid="input-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col gap-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-signin-submit"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCredentialsLogin(false);
                      setError('');
                      form.reset();
                    }}
                    data-testid="button-back-to-oauth"
                  >
                    Back to OAuth options
                  </Button>
                </div>
              </form>
            </Form>
          )}
          
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-medium" data-testid="link-register">
                Sign up
              </Link>
            </div>
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="text-primary hover:underline" data-testid="link-forgot-password">
                Forgot your password?
              </Link>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            Join the TCG streaming community and coordinate your next collaborative stream!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}